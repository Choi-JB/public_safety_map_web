export const FIXED_CHAT_ROOMS = [
    { idx: 1, label: "제보 대화방" },
    { idx: 2, label: "공지사항" },
  ] as const;
  
  export type FixedChatRoomIdx = (typeof FIXED_CHAT_ROOMS)[number]["idx"];
  
  export function isFixedChatRoom(idx: number): boolean {
    return FIXED_CHAT_ROOMS.some((r) => r.idx === idx);
  }
  
  export function fixedRoomLabel(idx: number): string | null {
    return FIXED_CHAT_ROOMS.find((r) => r.idx === idx)?.label ?? null;
  }
  
  /** 목록 표시용 제목 */
  export function roomDisplayTitle(idx: number): string {
    return fixedRoomLabel(idx) ?? `${idx}번 대화방`;
  }