export const DEFAULT_CHAT_ROOM_ID = "1";
export const MIN_ROOM_NUMBER = 1;
export const MAX_ROOM_NUMBER = 999;

export function resolveChatRoomId(value?: string | null): string {
  const n = parseRoomNumber(value);
  return String(n ?? MIN_ROOM_NUMBER);
}

/** 유효한 방 번호면 number, 아니면 null */
export function parseRoomNumber(value?: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value.trim());
  if (!Number.isInteger(n)) return null;
  if (n < MIN_ROOM_NUMBER || n > MAX_ROOM_NUMBER) return null;
  return n;
}

export function clampRoomNumber(n: number): number {
  if (!Number.isFinite(n)) return MIN_ROOM_NUMBER;
  return Math.min(MAX_ROOM_NUMBER, Math.max(MIN_ROOM_NUMBER, Math.trunc(n)));
}