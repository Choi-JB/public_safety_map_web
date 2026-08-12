export const FIXED_CHAT_ROOMS = [
  { idx: 1, label: "공지사항", room_type: "NOTICE" as const },
] as const;

export const NOTICE_ROOM_IDX = 1;

export type FixedChatRoomIdx = (typeof FIXED_CHAT_ROOMS)[number]["idx"];
export type ChatRoomType = "FIXED" | "NOTICE" | "ADMIN_DM";

export function isFixedChatRoom(idx: number): boolean {
  return FIXED_CHAT_ROOMS.some((r) => r.idx === idx);
}

export function isNoticeRoom(idx: number): boolean {
  return idx === NOTICE_ROOM_IDX;
}

export function fixedRoomLabel(idx: number): string | null {
  return FIXED_CHAT_ROOMS.find((r) => r.idx === idx)?.label ?? null;
}

export function roomDisplayTitle(idx: number): string {
  return fixedRoomLabel(idx) ?? `${idx}번 대화방`;
}

export function isAdminDmRoom(row: {
  idx: number;
  room_type?: string | null;
  user_id?: string | null;
}): boolean {
  if (row.room_type === "ADMIN_DM") return true;
  return !isFixedChatRoom(row.idx) && row.user_id != null;
}
