import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/chat/types";
import {
  FIXED_CHAT_ROOMS,
  isFixedChatRoom,
  roomDisplayTitle,
} from "@/lib/chat/fixedRooms";
import { ensureFixedRooms } from "@/lib/chat/messages";

export type AdminChatRoom = {
  idx: number;
  title: string;
  /** 방 소유자 = users.user_id (문자열) */
  user_id: string | null;
  is_active: "Y" | "N"; // UI 호환성을 위해 타입 유지 (DB에서는 삭제됨)
  message_count: number;
  created_at?: string;
};

export async function fetchAdminChatRooms(): Promise<AdminChatRoom[]> {
  const supabase = createClient();
  await ensureFixedRooms();

  // 🚨 is_active 컬럼 제거 및 room_name 추가 반영
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("idx, user_id, room_name, created_at")
    .order("idx", { ascending: true });
  if (error) throw error;

  const { data: msgRows, error: msgError } = await supabase
    .from("messages")
    .select("rooms_id");
  if (msgError) throw msgError;

  const countMap = new Map<number, number>();
  const roomsWithMessages = new Set<number>();
  for (const row of msgRows ?? []) {
    const id = Number((row as { rooms_id: number }).rooms_id);
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
    roomsWithMessages.add(id);
  }

  // 고정방 OR 메시지 있는 방만
  const filtered = (rooms ?? []).filter((r) => {
    const idx = r.idx as number;
    return isFixedChatRoom(idx) || roomsWithMessages.has(idx);
  });

  const mapped = filtered.map((r) => ({
    idx: r.idx as number,
    title: r.room_name || roomDisplayTitle(r.idx as number),
    user_id: r.user_id as string | null,
    is_active: "Y" as const, // DB에서 삭제되었으므로 화면이 깨지지 않게 항상 Y 반환
    message_count: countMap.get(r.idx as number) ?? 0,
    created_at: r.created_at ?? undefined,
  }));

  const byIdx = new Map(mapped.map((r) => [r.idx, r]));

  // DB에 없어도 제보·공지 항상 고정
  for (const fixed of FIXED_CHAT_ROOMS) {
    if (!byIdx.has(fixed.idx)) {
      byIdx.set(fixed.idx, {
        idx: fixed.idx,
        title: fixed.label,
        user_id: null,
        is_active: "Y",
        message_count: countMap.get(fixed.idx) ?? 0,
        created_at: undefined,
      });
    }
  }

  return Array.from(byIdx.values()).sort((a, b) => {
    const af = isFixedChatRoom(a.idx) ? 0 : 1;
    const bf = isFixedChatRoom(b.idx) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.idx - b.idx;
  });
}

/**
 * 방 생성
 * - ownerUserId가 user 테이블에 있어야 함 (문자열 FK)
 */
export async function createAdminChatRoom(input: {
  roomIdx?: number;
  ownerUserId?: string;
  ownerNickname?: string;
}): Promise<number> {
  const supabase = createClient();

  // 🚨 is_active 제거 및 room_name 추가
  const payload: Record<string, unknown> = {
    user_id: input.ownerUserId?.trim() || null,
    room_name: input.roomIdx ? `채팅방 ${input.roomIdx}` : "관리자 개설 방",
  };
  if (input.roomIdx != null) payload.idx = input.roomIdx;

  if (input.roomIdx != null) {
    const { data, error } = await supabase
      .from("chat_rooms")
      .upsert(payload, { onConflict: "idx" })
      .select("idx")
      .single();
    if (error) throw error;
    return data.idx as number;
  }

  const { data, error } = await supabase
    .from("chat_rooms")
    .insert(payload)
    .select("idx")
    .single();
  if (error) throw error;
  return data.idx as number;
}

// DB에서 is_active 컬럼이 삭제되었으므로 빈 함수로 남겨 에러 방지
export async function setAdminChatRoomActive(
  roomIdx: number,
  isActive: boolean
): Promise<void> {
  return Promise.resolve();
}

export async function fetchAdminRoomMessages(
  roomIdx: number
): Promise<ChatMessage[]> {
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
    ) // 🚨 users -> user 테이블명 조인 변경
    .eq("rooms_id", roomIdx)
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

export type AdminChatUser = {
  idx: number;
  user_id: string; // 🚨 추가됨 (문자열 ID)
  nickname: string;
  is_online: "Y" | "N";
  role: string;
  chat_enabled: "Y" | "N";
  created_at?: string;
};

export async function fetchAdminChatUsers(): Promise<AdminChatUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user") // 🚨 users -> user
    .select("idx, user_id, nickname, is_online, role, chat_enabled, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((u: any) => ({
    idx: u.idx as number,
    user_id: u.user_id as string,
    nickname: u.nickname as string,
    is_online: u.is_online as "Y" | "N",
    role: u.role as string,
    chat_enabled: (u.chat_enabled ?? "Y") as "Y" | "N",
    created_at: u.created_at ?? undefined,
  }));
}

/**
 * 특정 유저(user_id)가 관련된 방
 */
export async function fetchAdminRoomsByUser(input: {
  userId: string;
  nickname: string;
}): Promise<AdminChatRoom[]> {
  const supabase = createClient();
  await ensureFixedRooms();
  const uid = input.userId.trim();

  // 🚨 닉네임이나 숫자 idx 대신 문자열 user_id로 조회
  const { data: owned } = await supabase
    .from("chat_rooms")
    .select("idx")
    .eq("user_id", uid); 
    
  const { data: joined } = await supabase
    .from("room_participants")
    .select("rooms_id")
    .eq("user_id", uid);
    
  const relatedIds = new Set<number>([
    ...(owned ?? []).map((r) => Number((r as { idx: number }).idx)),
    ...(joined ?? []).map((r) => Number((r as { rooms_id: number }).rooms_id)),
  ]);
  
  const all = await fetchAdminChatRooms();
  return all.filter(
    (r) => isFixedChatRoom(r.idx) || relatedIds.has(r.idx)
  );
}

export type AdminChatHistoryItem = {
  idx: number;
  rooms_id: number;
  sender_id: string | null; // 🚨 숫자에서 문자열로 변경
  content: string;
  created_at?: string;
  is_archived: "Y" | "N";
  sender?: { nickname: string } | null;
};

export async function fetchAdminChatHistory(input?: {
  roomId?: number;
  nickname?: string;
  archivedOnly?: boolean;
}): Promise<AdminChatHistoryItem[]> {
  const supabase = createClient();

  let q = supabase
    .from("messages")
    .select(
      `
      idx,
      rooms_id,
      sender_id,
      content,
      created_at,
      is_archived,
      user:sender_id ( nickname )
    `
    ) // 🚨 users -> user 조인
    .order("created_at", { ascending: false })
    .limit(300);

  if (input?.roomId != null) q = q.eq("rooms_id", input.roomId);
  if (input?.archivedOnly) q = q.eq("is_archived", "Y");

  const { data, error } = await q;
  if (error) throw error;

  let rows = (data ?? []).map((row: any) => ({
    idx: row.idx as number,
    rooms_id: row.rooms_id as number,
    sender_id: row.sender_id as string | null,
    content: row.content as string,
    created_at: row.created_at as string | undefined,
    is_archived: (row.is_archived ?? "N") as "Y" | "N",
    sender: row.user ? { nickname: row.user.nickname as string } : null,
  }));

  if (input?.nickname?.trim()) {
    const nick = input.nickname.trim();
    rows = rows.filter((r) => r.sender?.nickname === nick);
  }

  return rows;
}

export async function archiveAdminMessage(
  messageIdx: number,
  archived: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ is_archived: archived ? "Y" : "N" })
    .eq("idx", messageIdx);
  if (error) throw error;
}

export async function deleteAdminMessage(messageIdx: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("messages").delete().eq("idx", messageIdx);
  if (error) throw error;
}

/** 채팅 허용(Y)/금지(N) */
export async function setUserChatEnabled(
  userId: string, // 🚨 숫자 idx에서 문자열 userId로 변경
  enabled: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user") // 🚨 users -> user
    .update({ chat_enabled: enabled ? "Y" : "N" })
    .eq("user_id", userId); // 🚨 외래키(식별자)를 user_id로 변경
  if (error) throw error;
}