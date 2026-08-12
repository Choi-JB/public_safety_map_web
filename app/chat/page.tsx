"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ensureChatUser,
  fetchMessages,
  markRoomAsRead,
  sendMessage,
  subscribeRoom,
} from "@/lib/chat/messages";
import type { ChatMessage } from "@/lib/chat/types";
import { useAuthStore } from "@/store/authStore";

type ChatPanelProps = {
  roomId: number;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user?.id != null;
  const myUserId = String(user?.id ?? "").trim(); // 👈 유저 ID 확보
  const nickname = (user?.nickname ?? "").trim();

  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("연결 중...");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. 유저 존재 확인 및 DB 등록
  useEffect(() => {
    if (!isLoggedIn || !nickname || !myUserId) return;

    let cancelled = false;

    (async () => {
      try {
        // 👈 myUserId 파라미터 추가!
        await ensureChatUser(myUserId, nickname);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "사용자 준비 실패");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, nickname, myUserId]);

  // 2. 메시지 로드 및 실시간 구독
  useEffect(() => {
    if (!isLoggedIn || !nickname || !myUserId) return;

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        setError(null);
        setStatus("연결 중...");
        setMessages([]);

        const past = await fetchMessages(roomId);
        if (cancelled) return;
        setMessages(past);

        // 👈 myUserId 파라미터 추가!
        await markRoomAsRead(roomId, myUserId, nickname);

        unsubscribe = subscribeRoom(
          roomId,
          (msg) => {
            setMessages((prev) => {
              if (prev.some((m) => m.idx === msg.idx)) return prev;
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
  }, [roomId, isLoggedIn, nickname, myUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontSize: 13 }}>
        <p>채팅을 이용하려면 로그인이 필요합니다.</p>
        <Link href="/login">로그인</Link>
      </div>
    );
  }

  if (!nickname) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontSize: 13 }}>
        <p>채팅을 쓰려면 닉네임이 필요합니다.</p>
      </div>
    );
  }

  async function handleSend() {
    const text = content.trim();
    if (!text || !nickname || !myUserId || sending) return;
  
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage({
        roomId,
        nickname,
        content: text,
        userId: myUserId,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.idx === msg.idx)) return prev;
        return [...prev, msg];
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
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      }}
    >
      <div
        style={{
          padding: "4px 10px",
          fontSize: 9,
          color: "#888",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{nickname}</span>
        <span>{status}</span>
      </div>

      <div
        style={{
          flex: 1,
          background: "#fff",
          padding: "8px 10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 0,
        }}
      >
        {messages.map((m) => {
          // 👈 sender_id가 myUserId(문자열)와 같은지 판별!
          const mine = m.sender_id === myUserId || m.sender?.nickname === nickname;

          return (
            <div
              key={m.idx}
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "82%",
                alignSelf: mine ? "flex-end" : "flex-start",
                alignItems: mine ? "flex-end" : "flex-start",
              }}
            >
              {!mine && (
                <div
                  style={{
                    fontSize: 9,
                    color: "#888",
                    marginBottom: 2,
                    padding: "0 2px",
                  }}
                >
                  {m.sender?.nickname ?? "상대방"}
                </div>
              )}
              <div
                style={{
                  padding: "6px 9px",
                  borderRadius: 12,
                  fontSize: 11,
                  lineHeight: 1.35,
                  wordBreak: "break-word",
                  background: mine ? "#111" : "#f1f1f3",
                  color: mine ? "#fff" : "#111",
                  borderBottomRightRadius: mine ? 3 : 12,
                  borderBottomLeftRadius: mine ? 12 : 3,
                }}
              >
                {m.content}
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: "#aaa",
                  marginTop: 2,
                  padding: "0 2px",
                }}
              >
                {formatTime(m.created_at)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p style={{ margin: 0, padding: "3px 10px", color: "#c00", fontSize: 9 }}>
          {error}
        </p>
      )}

      <div
        style={{
          padding: "8px 10px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#f1f1f3",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSend();
            }}
            placeholder="메시지 입력..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              padding: "7px 0",
              fontSize: 11,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !nickname || !content.trim()}
          aria-label="전송"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#111",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: sending ? "wait" : "pointer",
            flexShrink: 0,
            opacity: sending || !content.trim() ? 0.5 : 1,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}