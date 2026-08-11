"use client";

import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RoomPicker } from "@/components/chat/RoomPicker";
import { markRoomAsRead } from "@/lib/chat/messages";
import { useAuthStore } from "@/store/authStore";
import { roomDisplayTitle } from "@/lib/chat/fixedRooms";

type View = "list" | "room";

const FAB_MS = 220;

function MessageIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9.2L5.6 20.2a.8.8 0 0 1-1.3-.6V6.5Z"
        fill="#fff"
      />
      <circle cx="8.5" cy="10.5" r="1.15" fill="#E53935" />
      <circle cx="12" cy="10.5" r="1.15" fill="#E53935" />
      <circle cx="15.5" cy="10.5" r="1.15" fill="#E53935" />
    </svg>
  );
}

function PanelCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 6.5l11 11M17.5 6.5l-11 11"
        stroke="#333"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="#333"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatFab() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [roomId, setRoomId] = useState<number | null>(null);
  const nickname = (useAuthStore((s) => s.user)?.nickname ?? "").trim();

  /** FAB이 DOM에 있는지 */
  const [fabVisible, setFabVisible] = useState(true);
  /** 내려가는/올라오는 transition 중 */
  const [fabAnimatingOut, setFabAnimatingOut] = useState(false);
  const [fabAnimatingIn, setFabAnimatingIn] = useState(false);

  const openingRef = useRef(false);

  function openPanel() {
    if (openingRef.current || open) return;
    openingRef.current = true;
    setView("list");
    setRoomId(null);
    setFabAnimatingOut(true);
  }

  function closePanel() {
    setOpen(false);
    setView("list");
    setRoomId(null);
    setFabVisible(true);
    setFabAnimatingIn(true); // 아래·투명에서 시작
  }

  async function handleBack() {
    if (roomId != null && nickname) {
      try {
        await markRoomAsRead(roomId, nickname);
      } catch {
        // ignore
      }
    }
    setView("list");
    setRoomId(null);
  }

  function handleEnterRoom(id: number) {
    setRoomId(id);
    setView("room");
  }

  // FAB 내려가기 끝 → 패널 열기
  useEffect(() => {
    if (!fabAnimatingOut) return;
    const t = window.setTimeout(() => {
      setFabVisible(false);
      setFabAnimatingOut(false);
      setOpen(true);
      openingRef.current = false;
    }, FAB_MS);
    return () => window.clearTimeout(t);
  }, [fabAnimatingOut]);

  // FAB 다시 보일 때: 한 프레임 뒤 올라오기
  useEffect(() => {
    if (!fabVisible || !fabAnimatingIn) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFabAnimatingIn(false));
    });
    return () => cancelAnimationFrame(id);
  }, [fabVisible, fabAnimatingIn]);

  const title =
    view === "room" && roomId ? roomDisplayTitle(roomId) : "Chats";

  const fabDown = fabAnimatingOut || fabAnimatingIn;

  return (
    <>
      {fabVisible && (
        <button
          type="button"
          aria-label="채팅 열기"
          onClick={openPanel}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 1000,
            width: 64,
            height: 64,
            padding: 0,
            borderRadius: "50%",
            border: "none",
            background: "#E53935",
            boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: fabDown ? "translateY(80px)" : "translateY(0)",
            opacity: fabDown ? 0 : 1,
            transition: `transform ${FAB_MS}ms ease, opacity ${FAB_MS}ms ease`,
            pointerEvents: fabAnimatingOut ? "none" : "auto",
          }}
        >
          <MessageIcon />
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 24,
            zIndex: 999,
            width: 270,
            height: 320,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 48px)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
          }}
        >
          {/* 공통 헤더: list = 제목+X / room = ←+제목+X */}
          <header
            style={{
              background: "#fff",
              borderBottom: "1px solid #f0f0f0",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            {view === "room" ? (
              <button
                type="button"
                aria-label="대화방 목록으로"
                onClick={handleBack}
                style={iconBtnStyle}
              >
                <BackIcon />
              </button>
            ) : (
              <span style={{ width: 28 }} />
            )}

            <span
              style={{
                flex: 1,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {title}
            </span>

            <button
              type="button"
              aria-label="채팅 닫기"
              onClick={closePanel}
              style={iconBtnStyle}
            >
              <PanelCloseIcon />
            </button>
          </header>

          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            {view === "list" || !roomId ? (
              <RoomPicker onEnter={handleEnterRoom} />
            ) : (
              <ChatPanel roomId={roomId} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  border: "none",
  borderRadius: 8,
  background: "rgba(0,0,0,0.06)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};