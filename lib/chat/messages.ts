import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, SendMessageInput } from "./types";
import {
  FIXED_CHAT_ROOMS,
  isFixedChatRoom,
  isNoticeRoom,
  isAdminDmRoom,
  roomDisplayTitle,
} from "@/lib/chat/fixedRooms";
import type { RoomAccessInfo } from "./types";

export async function ensureChatUser(userId: string, nickname: string): Promise<string> {
  const supabase = createClient();
  const uid = userId.trim();
  const name = nickname.trim();

  if (!uid || !name) throw new Error("User ID와 닉네임이 모두 필요합니다.");

  const { data: existing } = await supabase
    .from("user")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user")
      .update({ nickname: name, is_online: "Y" })
      .eq("user_id", uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user").insert({
      user_id: uid,
      nickname: name,
      is_online: "Y",
      chat_enabled: "Y",
      role: "USER",
    });
    if (error) throw error;
  }

  return uid;
}

export async function getUserRole(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user")
    .select("role")
    .eq("user_id", userId.trim())
    .maybeSingle();
  return String((data as { role?: string } | null)?.role ?? "USER");
}

export async function fetchAdminUserIds(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user")
    .select("user_id")
    .eq("role", "ADMIN");
  if (error) throw error;
  return (data ?? []).map((r) => String((r as { user_id: string }).user_id));
}

async function fetchRoomRow(roomIdx: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("idx, user_id, room_name, room_type, created_at")
    .eq("idx", roomIdx)
    .maybeSingle();
  if (error) throw error;
  return data as {
    idx: number;
    user_id: string | null;
    room_name: string | null;
    room_type: string | null;
    created_at?: string;
  } | null;
}

export async function getRoomAccessInfo(
  roomIdx: number,
  userId: string,
  userRole?: string | null
): Promise<RoomAccessInfo> {
  const uid = userId.trim();
  const role = userRole?.trim() || (await getUserRole(uid));
  const row = await fetchRoomRow(roomIdx);

  if (!row) {
    return {
      idx: roomIdx,
      room_type: null,
      user_id: null,
      isAdminDm: false,
      isNotice: isNoticeRoom(roomIdx),
      canAccess: isFixedChatRoom(roomIdx),
      canWrite: isFixedChatRoom(roomIdx) && (!isNoticeRoom(roomIdx) || role === "ADMIN"),
    };
  }

  const isNotice = isNoticeRoom(row.idx) || row.room_type === "NOTICE";
  const isDm = isAdminDmRoom(row);

  let canAccess = false;
  if (isFixedChatRoom(row.idx)) canAccess = true;
  else if (isDm) canAccess = row.user_id === uid || role === "ADMIN";
  else canAccess = row.user_id === uid;

  let canWrite = canAccess;
  if (isNotice) canWrite = role === "ADMIN";
  else if (isDm) canWrite = row.user_id === uid || role === "ADMIN";

  return {
    idx: row.idx,
    room_type: row.room_type,
    user_id: row.user_id,
    isAdminDm: isDm,
    isNotice,
    canAccess,
    canWrite,
  };
}

async function assertCanAccessRoom(roomIdx: number, userId: string, userRole?: string | null) {
  const access = await getRoomAccessInfo(roomIdx, userId, userRole);
  if (!access.canAccess) {
    throw new Error("이 방에 접근할 수 없습니다.");
  }
  return access;
}

async function assertCanWriteRoom(roomIdx: number, userId: string, userRole?: string | null) {
  const access = await assertCanAccessRoom(roomIdx, userId, userRole);
  if (!access.canWrite) {
    if (access.isNotice) throw new Error("공지사항은 관리자만 작성할 수 있습니다.");
    throw new Error("메시지를 보낼 권한이 없습니다.");
  }
  return access;
}

async function registerAdminDmParticipants(roomIdx: number, ownerUserId: string) {
  await joinRoom(roomIdx, ownerUserId);
  const adminIds = await fetchAdminUserIds();
  for (const adminId of adminIds) {
    await joinRoom(roomIdx, adminId, "ADMIN");
  }
}

export async function getOrCreateAdminDmRoom(
  userId: string,
  nickname: string
): Promise<number> {
  const uid = userId.trim();
  const name = nickname.trim();
  if (!uid || !name) throw new Error("로그인 및 닉네임이 필요합니다.");

  await ensureChatUser(uid, name);

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("idx")
    .eq("user_id", uid)
    .eq("room_type", "ADMIN_DM")
    .maybeSingle();

  if (existing?.idx != null) {
    await registerAdminDmParticipants(existing.idx as number, uid);
    return existing.idx as number;
  }

  const { data: maxRow } = await supabase
    .from("chat_rooms")
    .select("idx")
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextIdx = Math.max(2, Number((maxRow as { idx?: number } | null)?.idx ?? 1) + 1);
  while (isFixedChatRoom(nextIdx)) nextIdx += 1;

  const { data: created, error } = await supabase
    .from("chat_rooms")
    .insert({
      idx: nextIdx,
      user_id: uid,
      room_name: "관리자와의 대화",
      room_type: "ADMIN_DM",
    })
    .select("idx")
    .single();

  if (error) throw error;

  const roomIdx = created.idx as number;
  await registerAdminDmParticipants(roomIdx, uid);
  return roomIdx;
}

export async function ensureChatRoom(
  roomIdx: number,
  ownerUserId: string
): Promise<number> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("idx")
    .eq("idx", roomIdx)
    .maybeSingle();

  if (existing?.idx != null) {
    return existing.idx as number;
  }

  const { data, error } = await supabase
    .from("chat_rooms")
    .insert({
      idx: roomIdx,
      user_id: isFixedChatRoom(roomIdx) ? null : ownerUserId.trim(),
      room_name: `채팅방 ${roomIdx}`,
    })
    .select("idx")
    .single();

  if (error) throw error;
  return data.idx as number;
}

export async function joinRoom(
  roomsId: number,
  userId: string,
  userRole?: string | null
): Promise<void> {
  const uid = userId.trim();
  if (!roomsId || !uid) return;

  await assertCanAccessRoom(roomsId, uid, userRole);

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("room_participants")
    .select("idx")
    .eq("rooms_id", roomsId)
    .eq("user_id", uid)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("room_participants").insert({
    rooms_id: roomsId,
    user_id: uid,
    last_read_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchMessages(
  roomId: number,
  userId: string,
  userRole?: string | null
): Promise<ChatMessage[]> {
  await assertCanAccessRoom(roomId, userId, userRole);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      idx,
      rooms_id,
      sender_id,
      content,
      created_at,
      user:sender_id (
        nickname
      )
    `
    )
    .eq("rooms_id", roomId)
    .eq("is_archived", "N")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    idx: row.idx,
    rooms_id: row.rooms_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    sender: row.user ? { nickname: row.user.nickname } : null,
  }));
}

export function subscribeRoom(
  roomId: number,
  onInsert: (message: ChatMessage) => void,
  onStatus?: (status: string) => void
): () => void {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `rooms_id=eq.${roomId}`,
      },
      (payload) => {
        const row = payload.new as {
          idx: number;
          rooms_id: number;
          sender_id: string | null;
          content: string;
          created_at?: string;
        };
        void (async () => {
          let sender: { nickname: string } | null = null;
          if (row.sender_id != null) {
            const { data: u } = await supabase
              .from("user")
              .select("nickname")
              .eq("user_id", row.sender_id)
              .maybeSingle();
            if (u?.nickname) {
              sender = { nickname: u.nickname as string };
            }
          }
          onInsert({
            idx: row.idx,
            rooms_id: row.rooms_id,
            sender_id: row.sender_id,
            content: row.content,
            created_at: row.created_at,
            sender,
          });
        })();
      }
    )
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function sendMessage({
  roomId,
  userId,
  nickname,
  content,
  userRole,
}: SendMessageInput): Promise<ChatMessage> {
  const trimmedContent = content.trim();
  const uid = userId.trim();
  const name = nickname.trim();

  if (!roomId || !uid || !name || !trimmedContent) {
    throw new Error("방, 유저 ID, 닉네임, 내용은 필수입니다.");
  }

  const validUserId = await ensureChatUser(uid, name);
  const role = userRole?.trim() || (await getUserRole(validUserId));

  {
    const supabaseBan = createClient();
    const { data: urow } = await supabaseBan
      .from("user")
      .select("chat_enabled")
      .eq("user_id", validUserId)
      .maybeSingle();
    if (urow && (urow as { chat_enabled?: string }).chat_enabled === "N") {
      throw new Error("채팅이 제한된 계정입니다. 관리자에게 문의하세요.");
    }
  }

  await assertCanWriteRoom(roomId, validUserId, role);

  const row = await fetchRoomRow(roomId);
  const roomsId = row?.idx ?? roomId;

  await joinRoom(roomsId, validUserId, role);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      rooms_id: roomsId,
      sender_id: validUserId,
      content: trimmedContent,
      is_archived: "N",
    })
    .select("idx, rooms_id, sender_id, content, created_at")
    .single();

  if (error) throw error;

  return {
    ...(data as ChatMessage),
    sender: { nickname: name },
  };
}

export type ChatRoomListItem = {
  idx: number;
  title: string;
  user_id: string | null;
  created_at?: string;
  unread_count: number;
};

export async function ensureFixedRooms(): Promise<void> {
  const supabase = createClient();
  for (const room of FIXED_CHAT_ROOMS) {
    const { data: existing } = await supabase
      .from("chat_rooms")
      .select("idx")
      .eq("idx", room.idx)
      .maybeSingle();

    if (existing) continue;

    await supabase.from("chat_rooms").insert({
      idx: room.idx,
      user_id: null,
      room_name: room.label,
      room_type: room.room_type,
    });
  }
}

export async function fetchChatRooms(
  userId?: string,
  nickname?: string
): Promise<ChatRoomListItem[]> {
  const supabase = createClient();
  await ensureFixedRooms();

  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("idx, user_id, room_name, room_type, created_at")
    .order("idx", { ascending: true });

  if (error) throw error;

  const roomList = rooms ?? [];
  const role = userId?.trim() ? await getUserRole(userId.trim()) : "USER";

  const visibleRooms = roomList.filter((r) => {
    const idx = r.idx as number;
    if (isFixedChatRoom(idx)) return true;
    const row = {
      idx,
      room_type: (r as { room_type?: string | null }).room_type ?? null,
      user_id: r.user_id as string | null,
    };
    if (isAdminDmRoom(row)) {
      return row.user_id === userId?.trim() || role === "ADMIN";
    }
    return row.user_id === userId?.trim();
  });

  if (visibleRooms.length === 0 && roomList.length === 0) {
    return FIXED_CHAT_ROOMS.map((r) => ({
      idx: r.idx,
      title: r.label,
      user_id: null,
      unread_count: 0,
    }));
  }

  if (!userId?.trim() || !nickname?.trim()) {
    return visibleRooms
      .map((r) => ({
        idx: r.idx as number,
        title: r.room_name || roomDisplayTitle(r.idx as number),
        user_id: r.user_id as string | null,
        created_at: r.created_at ?? undefined,
        unread_count: 0,
      }))
      .sort((a, b) => {
        const af = isFixedChatRoom(a.idx) ? 0 : 1;
        const bf = isFixedChatRoom(b.idx) ? 0 : 1;
        if (af !== bf) return af - bf;
        return a.idx - b.idx;
      });
  }

  const validUserId = await ensureChatUser(userId.trim(), nickname.trim());

  const { data: participants } = await supabase
    .from("room_participants")
    .select("rooms_id, last_read_at")
    .eq("user_id", validUserId);

  const lastReadMap = new Map<number, string | null>();
  for (const p of participants ?? []) {
    const roomsId = Number((p as { rooms_id: number }).rooms_id);
    const lastRead = (p as { last_read_at: string | null }).last_read_at;
    lastReadMap.set(roomsId, lastRead);
  }

  const { data: msgRows } = await supabase
    .from("messages")
    .select("rooms_id, sender_id, created_at")
    .eq("is_archived", "N");

  const unreadMap = new Map<number, number>();
  for (const row of msgRows ?? []) {
    const roomsId = Number((row as { rooms_id: number }).rooms_id);
    const senderId = String((row as { sender_id: string }).sender_id);
    const createdAt = String((row as { created_at: string }).created_at ?? "");

    if (senderId === validUserId) continue;
    if (!lastReadMap.has(roomsId)) continue;

    const lastRead = lastReadMap.get(roomsId);
    if (lastRead) {
      if (new Date(createdAt).getTime() > new Date(lastRead).getTime()) {
        unreadMap.set(roomsId, (unreadMap.get(roomsId) ?? 0) + 1);
      }
    } else {
      unreadMap.set(roomsId, (unreadMap.get(roomsId) ?? 0) + 1);
    }
  }

  return visibleRooms
    .map((r) => ({
      idx: r.idx as number,
      title: r.room_name || roomDisplayTitle(r.idx as number),
      user_id: r.user_id as string | null,
      created_at: r.created_at ?? undefined,
      unread_count: unreadMap.get(r.idx as number) ?? 0,
    }))
    .sort((a, b) => {
      const af = isFixedChatRoom(a.idx) ? 0 : 1;
      const bf = isFixedChatRoom(b.idx) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.idx - b.idx;
    });
}

export async function markRoomAsRead(
  roomId: number,
  userId: string,
  nickname: string
): Promise<void> {
  const uid = userId.trim();
  if (!roomId || !uid) return;

  const validUserId = await ensureChatUser(uid, nickname.trim());
  const role = await getUserRole(validUserId);
  await joinRoom(roomId, validUserId, role);

  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("room_participants")
    .update({ last_read_at: now })
    .eq("rooms_id", roomId)
    .eq("user_id", validUserId);

  if (error) throw error;
}

/** 관리자 패널: 권한 검사 없이 읽음 처리 */
export async function markRoomAsReadForAdmin(
  roomId: number,
  adminUserId: string,
  adminNickname: string
): Promise<void> {
  const uid = adminUserId.trim();
  if (!roomId || !uid) return;
  await ensureChatUser(uid, adminNickname.trim());
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("room_participants")
    .select("idx")
    .eq("rooms_id", roomId)
    .eq("user_id", uid)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("room_participants")
      .update({ last_read_at: now })
      .eq("rooms_id", roomId)
      .eq("user_id", uid);
  } else {
    await supabase.from("room_participants").insert({
      rooms_id: roomId,
      user_id: uid,
      last_read_at: now,
    });
  }
}

/** 관리자 패널: 권한 검사 없이 메시지 전송 */
export async function sendMessageAsAdmin(input: SendMessageInput): Promise<ChatMessage> {
  const { roomId, userId, nickname, content } = input;
  const uid = userId.trim();
  const name = nickname.trim();
  const trimmedContent = content.trim();
  if (!roomId || !uid || !name || !trimmedContent) {
    throw new Error("방, 유저 ID, 닉네임, 내용은 필수입니다.");
  }

  await ensureChatUser(uid, name);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      rooms_id: roomId,
      sender_id: uid,
      content: trimmedContent,
      is_archived: "N",
    })
    .select("idx, rooms_id, sender_id, content, created_at")
    .single();

  if (error) throw error;
  return { ...(data as ChatMessage), sender: { nickname: name } };
}
