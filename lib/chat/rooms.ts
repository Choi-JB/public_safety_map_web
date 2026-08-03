export const CHAT_ROOMS = [
    {
      id: "report",
      label: "위험 신고",
      description: "관리자 ↔ 사용자 다수",
    },
    {
      id: "notice",
      label: "공지사항",
      description: "관리자 ↔ 사용자 다수",
    },
    {
      id: "community",
      label: "커뮤니티",
      description: "사용자 다수",
    },
    {
      id: "witness",
      label: "목격자",
      description: "관리자 ↔ 사용자",
    },
  ] as const;
  
  export type ChatRoomId = (typeof CHAT_ROOMS)[number]["id"];
  
  export const DEFAULT_CHAT_ROOM_ID: ChatRoomId = "report";
  
  export function isChatRoomId(value: string): value is ChatRoomId {
    return CHAT_ROOMS.some((r) => r.id === value);
  }
  
  export function resolveChatRoomId(value?: string | null): ChatRoomId {
    if (value && isChatRoomId(value)) return value;
    return DEFAULT_CHAT_ROOM_ID;
  }