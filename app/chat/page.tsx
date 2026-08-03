"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { resolveChatRoomId } from "@/lib/chat/rooms";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const initialRoom = useMemo(
    () => resolveChatRoomId(searchParams.get("roomId")),
    [searchParams]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#abc1d1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div style={{ width: 380, height: 600 }}>
        <ChatPanel initialRoomId={initialRoom} />
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, textAlign: "center" }}>채팅 로딩 중…</main>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}