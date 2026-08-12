"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createChatRoom,
  fetchChatRooms,
  type ChatRoomListItem,
} from "@/lib/chat/messages";
import { useAuthStore } from "@/store/authStore";

type RoomPickerProps = {
  onEnter: (roomId: number) => void;
};

export function RoomPicker({ onEnter }: RoomPickerProps) {
  const user = useAuthStore((s) => s.user);
  const myUserId = String(user?.id ?? "").trim(); // 👈 유저 ID 확보
  const nickname = (user?.nickname ?? "").trim();

  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomId, setNewRoomId] = useState("");
  const [creating, setCreating] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 👈 myUserId 파라미터 추가!
      const list = await fetchChatRooms(myUserId || undefined, nickname || undefined);
      setRooms(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const isNetworkIssue =
        offline ||
        !navigator.onLine ||
        /failed to fetch|networkerror|load failed|missing next_public_supabase/i.test(msg);

      setError(
        isNetworkIssue
          ? "현재 인터넷 연결이 없습니다"
          : msg || "방 목록 로드 실패"
      );
    } finally {
      setLoading(false);
    }
  }, [myUserId, nickname]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  async function handleCreate() {
    const roomNum = Number(newRoomId.trim());
    if (!Number.isInteger(roomNum) || roomNum < 1) {
      setError("생성할 방 번호(숫자)를 입력해주세요.");
      return;
    }
    if (!nickname || !myUserId) {
      setError("방을 만들려면 로그인 및 닉네임이 필요합니다.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      // 👈 myUserId 파라미터 추가!
      await createChatRoom(roomNum, myUserId, nickname);
      setNewRoomId("");
      await loadRooms();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const isNetworkIssue =
        offline ||
        !navigator.onLine ||
        /failed to fetch|networkerror|load failed|missing next_public_supabase/i.test(msg);

      setError(
        isNetworkIssue
          ? "현재 인터넷 연결이 없습니다"
          : msg
            ? `방 생성 실패: ${msg}`
            : "방 생성 실패"
      );
      setCreating(false);
    }
  }

  function handleEnterRoom(roomIdx: number) {
    if (!nickname) {
      setError("입장하려면 닉네임이 필요합니다.");
      return;
    }
    onEnter(roomIdx);
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          padding: "6px 10px 8px",
          borderBottom: "1px solid #f0f0f0",
          fontSize: 11,
          color: "#666",
        }}
      >
        {nickname ? (
          <>
            <span style={{ color: "#111", fontWeight: 600 }}>{nickname}</span>
            <span> 님</span>
          </>
        ) : (
          <span style={{ color: "#c00" }}>닉네임이 없습니다. 로그인 정보를 확인하세요.</span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          padding: "6px 0",
        }}
      >
        {loading && (
          <div style={{ textAlign: "center", color: "#999", marginTop: 24, fontSize: 11 }}>
            불러오는 중…
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", marginTop: 24, fontSize: 11 }}>
            개설된 채팅방이 없습니다.
          </div>
        )}

        {!loading &&
          rooms.map((room) => (
            <button
              key={room.idx}
              type="button"
              onClick={() => handleEnterRoom(room.idx)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                padding: "8px 10px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fafafa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "#e5e5ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#555",
                  fontSize: 12,
                  marginRight: 10,
                  flexShrink: 0,
                }}
              >
                {room.idx === 1 ? "제" : room.idx === 2 ? "공" : room.idx}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#111",
                    marginBottom: 2,
                  }}
                >
                  {room.title ?? `${room.idx}번 대화방`}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#888",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  개설자: {room.idx === 1 || room.idx === 2 ? "관리자" : room.user_id || "알 수 없음"}
                </div>
              </div>

              {room.unread_count > 0 && (
                <div
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "#FEE500",
                    color: "#111",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginLeft: 6,
                    lineHeight: 1,
                  }}
                >
                  {room.unread_count > 99 ? "99+" : room.unread_count}
                </div>
              )}
            </button>
          ))}
      </div>

      {offline && (
        <p
          style={{
            margin: 0,
            padding: "4px 14px",
            fontSize: 9,
            color: "#c00",
          }}
        >
          현재 인터넷 연결이 없습니다
        </p>
      )}
      
      {error && (
        <p
          style={{
            margin: 0,
            padding: "4px 14px",
            fontSize: 9,
            color: "#c00",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={newRoomId}
          onChange={(e) => setNewRoomId(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreate();
          }}
          placeholder="방 번호"
          style={{
            flex: 1,
            padding: "6px 8px",
            border: "1px solid #e1e1e1",
            borderRadius: 10,
            fontSize: 11,
            outline: "none",
          }}
        />
        <button
          type="button"
          disabled={creating || !nickname}
          onClick={() => void handleCreate()}
          style={{
            background: "#007aff",
            color: "#fff",
            border: "none",
            padding: "0 10px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 11,
            cursor: creating ? "wait" : "pointer",
            opacity: creating || !nickname ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {creating ? "…" : "만들기"}
        </button>
      </div>
    </div>
  );
}