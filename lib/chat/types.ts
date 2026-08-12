export type ChatUser = {
  idx: number;
  nickname: string;
  is_online: "Y" | "N";
  role: string;
};

export type ChatRoom = {
  idx: number;
  /** users.nickname 을 참조하는 문자열 */
  user_id: string | null;
  is_active: "Y" | "N";
  created_at?: string;
};

export type ChatMessage = {
  idx: number;
  rooms_id: number;
  sender_id: string | null;
  content: string;
  created_at?: string;
  sender?: { nickname: string } | null;
};

export type SendMessageInput = {
  roomId: number;
  userId: string;
  nickname: string;
  content: string;
  userRole?: string | null;
};

export type RoomAccessInfo = {
  idx: number;
  room_type: string | null;
  user_id: string | null;
  isAdminDm: boolean;
  isNotice: boolean;
  canAccess: boolean;
  canWrite: boolean;
};
