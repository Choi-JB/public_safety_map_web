import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, SendMessageInput } from "./types"; // SendMessageInput에 userId 필드가 추가되어야 합니다!
import {
  FIXED_CHAT_ROOMS,
  isFixedChatRoom,
  roomDisplayTitle,
} from "@/lib/chat/fixedRooms";

/** 
 * 유저 확보 후 문자열 user_id 반환 (새 DB 구조 반영)
 */
export async function ensureChatUser(userId: string, nickname: string): Promise<string> {
  const supabase = createClient();
  const uid = userId.trim();
  const name = nickname.trim();
  
  if (!uid || !name) throw new Error("User ID와 닉네임이 모두 필요합니다.");

  // 새 DB에서는 user 테이블의 user_id가 고유키(UNIQUE)이므로 upsert 사용이 깔끔합니다.
  const { error } = await supabase
    .from("user")
    .upsert({ 
      user_id: uid, 
      nickname: name, 
      is_online: "Y", 
      chat_enabled: "Y", 
      role: "USER" 
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return uid;
}

/**
 * 방이 없으면 생성, 있으면 idx 반환
 */
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
      room_name: `채팅방 ${roomIdx}` // 추가된 room_name 컬럼 반영
    })
    .select("idx")
    .single();

  if (error) throw error;
  return data.idx as number;
}

/**
 * 방 참가 (user_id는 이제 문자열입니다)
 */
export async function joinRoom(
  roomsId: number,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("room_participants")
    .select("idx")
    .eq("rooms_id", roomsId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("room_participants").insert({
    rooms_id: roomsId,
    user_id: userId,
    last_read_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchMessages(roomId: number): Promise<ChatMessage[]> {
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
          sender_id: string | null; // 문자열로 변경
          content: string;
          created_at?: string;
        };
        void (async () => {
          let sender: { nickname: string } | null = null;
          if (row.sender_id != null) {
            const { data: u } = await supabase
              .from("user") // users -> user
              .select("nickname")
              .eq("user_id", row.sender_id) // idx -> user_id
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
  userId, // SendMessageInput 타입에 userId를 추가해주셔야 합니다.
  nickname,
  content,
}: SendMessageInput & { userId: string }): Promise<ChatMessage> {
  const trimmedContent = content.trim();
  const uid = userId.trim();
  const name = nickname.trim();

  if (!roomId || !uid || !name || !trimmedContent) {
    throw new Error("방, 유저 ID, 닉네임, 내용은 필수입니다.");
  }

  const validUserId = await ensureChatUser(uid, name);

  // 채팅 금지 확인
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
  
  const roomsId = await ensureChatRoom(roomId, validUserId);

  // 3) 참가자 등록
  await joinRoom(roomsId, validUserId);

  // 4) 메시지 전송
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      rooms_id: roomsId,
      sender_id: validUserId,
      content: trimmedContent,
      is_archived: "N"
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
      room_name: room.label // label을 room_name으로 저장
    });
  }
}

export async function fetchChatRooms(
  userId?: string, 
  nickname?: string
): Promise<ChatRoomListItem[]> {
  const supabase = createClient();
  await ensureFixedRooms();

  // is_active가 제거되었으므로 조건 생략
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("idx, user_id, room_name, created_at")
    .order("idx", { ascending: true });

  if (error) throw error;

  const roomList = rooms ?? [];
  if (roomList.length === 0) {
    return FIXED_CHAT_ROOMS.map((r) => ({
      idx: r.idx,
      title: r.label,
      user_id: null,
      unread_count: 0,
    }));
  }

  if (!userId?.trim() || !nickname?.trim()) {
    return roomList
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

  return roomList
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

export async function createChatRoom(
  roomIdx: number,
  userId: string,
  nickname: string
): Promise<void> {
  const uid = userId.trim();
  const name = nickname.trim();
  
  if (!Number.isInteger(roomIdx) || roomIdx < 1 || !uid || !name) {
    throw new Error("생성할 방 번호(숫자)와 유저 ID, 닉네임이 모두 필요합니다.");
  }
  if (isFixedChatRoom(roomIdx)) {
    throw new Error("제보/공지사항 방 번호는 사용할 수 없습니다.");
  }

  const supabase = createClient();

  // 방 만들기 전 유저 등록 보장
  await ensureChatUser(uid, name);

  const { error } = await supabase.from("chat_rooms").insert({
    idx: roomIdx,
    user_id: uid,
    room_name: `채팅방 ${roomIdx}`
  });

  if (error) throw error;
}

export async function markRoomAsRead(
  roomId: number,
  userId: string,
  nickname: string
): Promise<void> {
  const uid = userId.trim();
  if (!roomId || !uid) return;

  const validUserId = await ensureChatUser(uid, nickname.trim());
  await joinRoom(roomId, validUserId);

  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("room_participants")
    .update({ last_read_at: now })
    .eq("rooms_id", roomId)
    .eq("user_id", validUserId);

  if (error) throw error;
}