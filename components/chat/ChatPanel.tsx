"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  subscribeRoom,
} from "@/lib/chat/messages";
import {
  CHAT_ROOMS,
  DEFAULT_CHAT_ROOM_ID,
  resolveChatRoomId,
  type ChatRoomId,
} from "@/lib/chat/rooms";
import type { ChatMessage } from "@/lib/chat/types";
import { useAuthStore } from "@/store/authStore";

type ChatPanelProps = {
  /** 허용된 4개 방만. 없으면 신고(report) */
  initialRoomId?: string;
};

export function ChatPanel({ initialRoomId }: ChatPanelProps) {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user?.id != null;
  const senderId = isLoggedIn ? String(user.id) : "";
  const displayName = user?.nickname ?? senderId;

  const [roomId, setRoomId] = useState<ChatRoomId>(() =>
    resolveChatRoomId(initialRoomId)
  );
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("연결 중...");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentRoom =
    CHAT_ROOMS.find((r) => r.id === roomId) ?? CHAT_ROOMS[0];

  useEffect(() => {
    setRoomId(resolveChatRoomId(initialRoomId));
  }, [initialRoomId]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        setError(null);
        setStatus("연결 중...");
        const past = await fetchMessages(roomId);
        if (cancelled) return;
        setMessages(past);
        unsubscribe = subscribeRoom(
          roomId,
          (msg) => {
            setMessages((prev) => {
              if (prev.some((m) => m.message_id === msg.message_id)) return prev;
              return [...prev, msg];
            });
          },
          (s) => setStatus(s === "SUBSCRIBED" ? "연결됨" : s)
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "채팅 연결 실패");
          setStatus("오류");
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [roomId, isLoggedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>채팅을 이용하려면 로그인이 필요합니다.</p>
        <Link href="/login">로그인</Link>
      </div>
    );
  }

  async function handleSend() {
    const text = content.trim();
    if (!text || !senderId || sending) return;

    setSending(true);
    setError(null);
    try {
      await sendMessage({
        roomId,
        senderId,
        content: text,
        senderName: displayName,
      });
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송 실패");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      }}
    >
      <header
        style={{
          background: "#FEE500",
          padding: "12px 14px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{currentRoom.label}</span>
        <span style={{ fontSize: 12, fontWeight: "normal", color: "#555" }}>
          {status}
        </span>
      </header>

      {/* 고정 4개 방 탭 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid #eee",
          background: "#f7f7f7",
        }}
      >
        {CHAT_ROOMS.map((room) => {
          const active = room.id === roomId;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => setRoomId(room.id)}
              style={{
                padding: "10px 4px",
                border: "none",
                borderBottom: active ? "2px solid #E53935" : "2px solid transparent",
                background: active ? "#fff" : "transparent",
                fontWeight: active ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                color: active ? "#111" : "#666",
              }}
            >
              {room.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "6px 12px", fontSize: 11, color: "#777" }}>
        {currentRoom.description} · {displayName}
      </div>

      <div
        style={{
          flex: 1,
          background: "#b2c7d9",
          padding: 15,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m) => {
          const mine = m.sender_id === senderId;
          return (
            <div
              key={m.message_id}
              style={{
                maxWidth: "70%",
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 14,
                alignSelf: mine ? "flex-end" : "flex-start",
                background: mine ? "#FEE500" : "#fff",
                borderTopRightRadius: mine ? 2 : 14,
                borderTopLeftRadius: mine ? 14 : 2,
              }}
            >
              {!mine && (
                <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>
                  {m.sender_id}
                </div>
              )}
              <div>{m.content}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p style={{ padding: "6px 12px", color: "#c00", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 10,
          borderTop: "1px solid #eee",
        }}
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
          placeholder={`${currentRoom.label}에 메시지 입력...`}
          style={{ flex: 1, padding: 8 }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !senderId}
        >
          전송
        </button>
      </div>
    </div>
  );
}