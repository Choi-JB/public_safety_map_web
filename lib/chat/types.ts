export type ChatMessage = {
    message_id: string;
    room_id: string;
    sender_id: string | null;
    content: string;
    message_type: string;
    created_at?: string;
  };
  
  export type SendMessageInput = {
    roomId: string;
    senderId: string;
    content: string;
    /** users.name 에 넣을 표시 이름 (닉네임) */
    senderName?: string;
  };