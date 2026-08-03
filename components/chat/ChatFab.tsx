"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";


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
      {/* 말풍선 */}
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9.2L5.6 20.2a.8.8 0 0 1-1.3-.6V6.5Z"
        fill="#fff"
      />
      {/* 메시지 점 3개 */}
      <circle cx="8.5" cy="10.5" r="1.15" fill="#E53935" />
      <circle cx="12" cy="10.5" r="1.15" fill="#E53935" />
      <circle cx="15.5" cy="10.5" r="1.15" fill="#E53935" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6.5 6.5l11 11M17.5 6.5l-11 11"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "채팅 닫기" : "채팅 열기"}
        onClick={() => setOpen((v) => !v)}
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
          background: open ? "#333" : "#E53935",
          boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <CloseIcon /> : <MessageIcon />}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 96,
            zIndex: 999,
            width: 360,
            height: 560,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
            background: "#fff",
          }}
        >
          <ChatPanel initialRoomId="report" />
        </div>
      )}
    </>
  );
}