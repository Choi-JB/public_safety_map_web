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
  sender_id: string | null; // 👈 number에서 string으로 변경!
  content: string;
  created_at?: string;
  sender?: { nickname: string } | null;
};

export type SendMessageInput = {
  /** chat_rooms.idx */
  roomId: number;
  userId: string;
  /** users.nickname */
  nickname: string;
  content: string;
};

export type ChatReportStatus = "PENDING" | "RESOLVED" | "REJECTED";

export type ChatReport = {
  idx: number;
  message_idx: number | null;
  rooms_id: number;
  reporter_id: string | null;
  reported_id: string | null;
  content_snapshot: string | null;
  reason: string | null;
  status: ChatReportStatus;
  created_at?: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
};