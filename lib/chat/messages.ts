import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, SendMessageInput } from "./types";

export async function fetchMessages(roomId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export function subscribeRoom(
  roomId: string,
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
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onInsert(payload.new as ChatMessage);
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
  senderId,
  content,
  senderName,
}: SendMessageInput): Promise<ChatMessage> {
  const supabase = createClient();
  const trimmedContent = content.trim();
  const trimmedSenderId = senderId.trim();
  const trimmedName = (senderName ?? senderId).trim();

  if (!roomId || !trimmedSenderId || !trimmedContent) {
    throw new Error("방이름, 보내는사람(익명), 대화내용은 필수입니다.");
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      user_id: trimmedSenderId,
      name: trimmedName,
      is_online: true,
      role: "USER",
    },
    { onConflict: "user_id" }
  );
  if (userError) throw userError;

  const { error: roomError } = await supabase.from("chat_rooms").upsert(
    {
      room_id: roomId,
      room_name: `${roomId}번 대화방`,
      room_type: "DIRECT",
      is_active: true,
    },
    { onConflict: "room_id" }
  );
  if (roomError) throw roomError;

  const message: ChatMessage = {
    message_id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    room_id: roomId,
    sender_id: trimmedSenderId,
    content: trimmedContent,
    message_type: "TEXT",
  };

  const { error: msgError } = await supabase.from("messages").insert(message);
  if (msgError) throw msgError;

  return message;
}