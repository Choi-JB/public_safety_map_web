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
import { reportMessage } from "@/lib/chat/reports";
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

export function ChatPanel({ roomId }: ChatPanelProps) {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user?.id != null;
  const nickname = (user?.nickname ?? "").trim();
  const myUserId = String(user?.id ?? "").trim(); // 유저 ID 추출

  // number | null 에서 string | null 로 타입 변경!
  const [myUserIdx, setMyUserIdx] = useState<string | null>(null);
  
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("연결 중...");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reportingIdx, setReportingIdx] = useState<number | null>(null);
  const REPORT_REASONS = [
    "욕설/비방",
    "스팸/광고",
    "부적절한 홍보",
    "기타",
  ] as const;
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] =
    useState<(typeof REPORT_REASONS)[number]>("욕설/비방");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn || !nickname || !myUserId) {
      setMyUserIdx(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // ⭐ 인자 2개 (myUserId, nickname) 완벽하게 전달
        const idx = await ensureChatUser(myUserId, nickname);
        if (!cancelled) setMyUserIdx(idx);
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

        // ⭐ 인자 3개 (roomId, myUserId, nickname) 완벽하게 전달
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

  function openReportModal(m: ChatMessage) {
    if (!myUserId || !m.sender_id) {
      setError("신고 할 수 없습니다.");
      return;
    }
    if (m.sender_id === myUserId) {
      setError("자신의 메세지는 신고 할 수 없습니다.");
      return;
    }
    setReportReason("욕설/비방");
    setReportTarget(m);
  }

  async function submitReport() {
    const m = reportTarget;
    if (!m || !myUserId || !m.sender_id) return;

    setReportingIdx(m.idx);
    setError(null);
    try {
      await reportMessage({
        messageIdx: m.idx,
        roomsId: m.rooms_id,
        reporterId: myUserId,
        reportedId: m.sender_id,
        contentSnapshot: m.content,
        reason: reportReason,
      });
      setReportTarget(null);
      alert("신고 되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "신고 실패, 관리자에게 문의해주십시오.");
    } finally {
      setReportingIdx(null);
    }
  }

  async function handleSend() {
    const text = content.trim();
    if (!text || !nickname || !myUserId || sending) return; // myUserId 누락 방지 로직 추가
  
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage({
        roomId,
        nickname,
        content: text,
        userId: myUserId,
      });
      // 전송 성공 시 즉시 화면에 반영 (Realtime 없어도 보이게)
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
      {/* 상태 줄 */}
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

      {/* 메시지 영역 */}
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
          // ⭐ 문자열 기반으로 내 메시지인지 완벽하게 판별
          const mine =
            m.sender_id === myUserIdx || m.sender?.nickname === nickname;

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
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{formatTime(m.created_at)}</span>
                {!mine && m.sender_id && (
                  <button
                    type="button"
                    disabled={reportingIdx === m.idx}
                    onClick={() => openReportModal(m)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#e53935",
                      fontSize: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {reportingIdx === m.idx ? "신고중…" : "신고"}
                  </button>
                )}
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

      {/* 입력 영역 */}
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

      {reportTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              width: 280,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>신고 사유 선택</div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
              {reportTarget.content.slice(0, 80)}
              {reportTarget.content.length > 80 ? "…" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {REPORT_REASONS.map((reason) => (
                <label key={reason} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                  />
                  {reason}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={reportingIdx === reportTarget.idx}
                onClick={() => void submitReport()}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#e53935",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {reportingIdx === reportTarget.idx ? "신고중…" : "신고하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}