"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  archiveAdminMessage,
  createAdminChatRoom,
  deleteAdminMessage,
  fetchAdminChatHistory,
  fetchAdminChatRooms,
  fetchAdminChatUsers,
  fetchAdminRoomMessages,
  fetchAdminRoomsByUser,
  setUserChatEnabled,
  type AdminChatHistoryItem,
  type AdminChatRoom,
  type AdminChatUser,
} from "@/lib/chat/adminRooms";
import { sendMessage, subscribeRoom } from "@/lib/chat/messages";
import type { ChatMessage } from "@/lib/chat/types";
import { useAuthStore } from "@/store/authStore";
import styles from "../admin.module.css";

type ChatSubMenu = "rooms" | "users" | "history";

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function AdminChatPanel() {
  const admin = useAuthStore((s) => s.user);
  const adminNickname = (admin?.nickname ?? "").trim() || "admin";
  const adminUserId = String(admin?.id ?? "").trim() || "admin_id"; // 관리자 ID 추가

  const [subMenu, setSubMenu] = useState<ChatSubMenu>("rooms");

  const [rooms, setRooms] = useState<AdminChatRoom[]>([]);
  const [users, setUsers] = useState<AdminChatUser[]>([]);
  const [userRooms, setUserRooms] = useState<AdminChatRoom[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminChatUser | null>(null);

  const [history, setHistory] = useState<AdminChatHistoryItem[]>([]);
  const [historyRoomFilter, setHistoryRoomFilter] = useState("");
  const [historyNickFilter, setHistoryNickFilter] = useState("");
  const [historyArchivedOnly, setHistoryArchivedOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newRoomId, setNewRoomId] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await fetchAdminChatRooms());
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 목록 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchAdminChatUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "유저 목록 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roomId = historyRoomFilter.trim()
        ? Number(historyRoomFilter.trim())
        : undefined;
      setHistory(
        await fetchAdminChatHistory({
          roomId: Number.isInteger(roomId) ? roomId : undefined,
          nickname: historyNickFilter.trim() || undefined,
          archivedOnly: historyArchivedOnly,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "채팅기록 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [historyRoomFilter, historyNickFilter, historyArchivedOnly]);

  useEffect(() => {
    if (subMenu === "rooms") void loadRooms();
    if (subMenu === "users") void loadUsers();
    if (subMenu === "history") void loadHistory();
  }, [subMenu, loadRooms, loadUsers, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedRoomId == null) return;

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      setMsgLoading(true);
      setError(null);
      try {
        const rows = await fetchAdminRoomMessages(selectedRoomId);
        if (cancelled) return;
        setMessages(rows);
        unsubscribe = subscribeRoom(selectedRoomId, (msg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.idx === msg.idx)) return prev;
            return [...prev, msg];
          });
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "메시지 로드 실패");
          setMessages([]);
        }
      } finally {
        if (!cancelled) setMsgLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedRoomId]);

  async function handleCreateRoom() {
    const id = newRoomId.trim();
    setCreating(true);
    setError(null);
    try {
      const idx = await createAdminChatRoom({
        roomIdx: id ? Number(id) : undefined,
        ownerUserId: adminUserId, // 관리자 ID 전달
        ownerNickname: adminNickname,
      });
      setNewRoomId("");
      await loadRooms();
      setSelectedRoomId(idx);
      setSubMenu("rooms");
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 생성 실패");
    } finally {
      setCreating(false);
    }
  }

  async function handleSelectUser(u: AdminChatUser) {
    setSelectedUser(u);
    setSelectedRoomId(null);
    setMessages([]);
    setError(null);
    try {
      setUserRooms(
        await fetchAdminRoomsByUser({
          userId: String(u.user_id), // idx 대신 문자열 user_id 전달
          nickname: u.nickname,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "유저 방 조회 실패");
      setUserRooms([]);
    }
  }

  async function handleSend() {
    const text = content.trim();
    if (!text || selectedRoomId == null || sending) return;

    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage({
        roomId: selectedRoomId,
        nickname: adminNickname,
        content: text,
        userId: adminUserId,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.idx === msg.idx)) return prev;
        return [...prev, msg];
      });
      setContent("");
      await loadRooms();
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송 실패");
    } finally {
      setSending(false);
    }
  }

  const roomList = subMenu === "rooms" ? rooms : userRooms;

  return (
    <div>
      <div className={styles.panelHeader}>채팅 관리</div>

      {/* 소메뉴 */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
        <button
          type="button"
          className={`${styles.button} ${subMenu === "rooms" ? styles.buttonPrimary : ""}`}
          onClick={() => {
            setSubMenu("rooms");
            setSelectedUser(null);
            setUserRooms([]);
          }}
        >
          대화방
        </button>
        <button
          type="button"
          className={`${styles.button} ${subMenu === "users" ? styles.buttonPrimary : ""}`}
          onClick={() => {
            setSubMenu("users");
            setSelectedRoomId(null);
            setMessages([]);
          }}
        >
          유저
        </button>
        <button
          type="button"
          className={`${styles.button} ${subMenu === "history" ? styles.buttonPrimary : ""}`}
          onClick={() => {
            setSubMenu("history");
            setSelectedRoomId(null);
            setSelectedUser(null);
          }}
        >
          채팅기록
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#666", alignSelf: "center" }}>
          관리자: <b>{adminNickname}</b>
        </span>
      </div>

      <div className={styles.panelBody}>
        {error && (
          <div className={`${styles.notice} ${styles.noticeError}`} style={{ marginBottom: 12 }}>
            {error}
            <button type="button" className={styles.button} style={{ marginLeft: 8 }} onClick={() => setError(null)}>
              닫기
            </button>
          </div>
        )}

        {subMenu === "history" && (
          <div>
            <div className={styles.filterRow} style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <input
                placeholder="방 번호"
                value={historyRoomFilter}
                onChange={(e) => setHistoryRoomFilter(e.target.value.replace(/[^\d]/g, ""))}
                style={{ width: 90, padding: 8 }}
              />
              <input
                placeholder="닉네임"
                value={historyNickFilter}
                onChange={(e) => setHistoryNickFilter(e.target.value)}
                style={{ width: 140, padding: 8 }}
              />
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={historyArchivedOnly}
                  onChange={(e) => setHistoryArchivedOnly(e.target.checked)}
                />
                보관만
              </label>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void loadHistory()}>
                조회
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>idx</th>
                    <th>방</th>
                    <th>보낸사람 (id/nick)</th>
                    <th>내용</th>
                    <th>시간</th>
                    <th>보관</th>
                    <th>조치</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7}>불러오는 중…</td></tr>
                  )}
                  {!loading && history.length === 0 && (
                    <tr><td colSpan={7}>기록 없음</td></tr>
                  )}
                  {history.map((h) => (
                    <tr key={h.idx}>
                      <td>{h.idx}</td>
                      <td>{h.rooms_id}</td>
                      <td>
                        {h.sender_id ?? "-"} / {h.sender?.nickname ?? "-"}
                      </td>
                      <td style={{ maxWidth: 280, wordBreak: "break-word" }}>{h.content}</td>
                      <td>{h.created_at ?? "-"}</td>
                      <td>{h.is_archived === "Y" ? "보관됨" : "일반"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className={styles.button}
                          style={{ marginRight: 4 }}
                          onClick={() =>
                            void (async () => {
                              await archiveAdminMessage(h.idx, h.is_archived !== "Y");
                              await loadHistory();
                            })()
                          }
                        >
                          {h.is_archived === "Y" ? "보관해제" : "보관"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => {
                            if (!confirm("이 메시지를 영구 삭제할까요?")) return;
                            void (async () => {
                              await deleteAdminMessage(h.idx);
                              await loadHistory();
                            })();
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              제재: <b>유저</b> 소메뉴에서 해당 유저의 파란/빨간 버튼으로 채팅 허용·금지를 설정하세요.
            </p>
          </div>
        )}

        {subMenu !== "history" && (
        <div style={{ display: "flex", gap: 16, minHeight: 480 }}>
          {/* 왼쪽: 목록 */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
            }}
          >
            {subMenu === "users" && !selectedUser && (
              <>
                <div style={{ padding: 12, fontWeight: 700, borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                  유저 목록 (id / nickname)
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {loading && <div style={{ padding: 16, color: "#888", fontSize: 12 }}>불러오는 중…</div>}
                  {!loading && users.length === 0 && (
                    <div style={{ padding: 16, color: "#888", fontSize: 12 }}>유저 없음</div>
                  )}
                  {users.map((u) => (
                    <div
                      key={u.idx}
                      role="button"
                      tabIndex={0}
                      onClick={() => void handleSelectUser(u)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") void handleSelectUser(u);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: "1px solid #f5f5f5",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        {u.user_id} · {u.nickname}
                      </div>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {u.role} · {u.is_online === "Y" ? "online" : "offline"}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void (async () => {
                            const next = u.chat_enabled !== "Y";
                            // user_id를 기반으로 상태 업데이트 (adminRooms.ts 수정 필요)
                            await setUserChatEnabled(u.user_id, next);
                            await loadUsers();
                          })();
                        }}
                        style={{
                          marginTop: 6,
                          border: "none",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "#fff",
                          background: u.chat_enabled === "Y" ? "#e53935" : "#007aff",
                        }}
                      >
                        {u.chat_enabled === "Y" ? "채팅 금지" : "채팅 허용"}
                      </button>
                    </div>
                  ))}                </div>
              </>
            )}

            {(subMenu === "rooms" || (subMenu === "users" && selectedUser)) && (
              <>
                <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                    {subMenu === "users" && selectedUser
                      ? `${selectedUser.nickname} 의 방`
                      : "대화방 목록"}
                  </div>
                  {subMenu === "users" && selectedUser && (
                    <button
                      type="button"
                      className={styles.button}
                      style={{ marginBottom: 8, fontSize: 11 }}
                      onClick={() => {
                        setSelectedUser(null);
                        setUserRooms([]);
                        setSelectedRoomId(null);
                      }}
                    >
                      ← 유저 목록
                    </button>
                  )}
                  {subMenu === "rooms" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={newRoomId}
                        onChange={(e) => setNewRoomId(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="방 번호"
                        style={{ flex: 1, padding: 6, fontSize: 12, borderRadius: 8, border: "1px solid #ddd" }}
                      />
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        disabled={creating}
                        onClick={() => void handleCreateRoom()}
                        style={{ fontSize: 12 }}
                      >
                        만들기
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                  {loading && <div style={{ padding: 16, color: "#888", fontSize: 12 }}>불러오는 중…</div>}
                  {!loading && roomList.length === 0 && (
                    <div style={{ padding: 16, color: "#888", fontSize: 12 }}>방 없음</div>
                  )}
                  {roomList.map((room) => (
                    <button
                      key={room.idx}
                      type="button"
                      onClick={() => setSelectedRoomId(room.idx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: "1px solid #f5f5f5",
                        background: selectedRoomId === room.idx ? "#f5f5f7" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#e5e5ea",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {room.idx}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {room.title ?? `${room.idx}번 대화방`}
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          개설자: {room.idx === 1 || room.idx === 2 ? "관리자" : room.user_id ?? "-"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 오른쪽: 대화 (사용자 UI와 동일 톤) */}
          <div
            style={{
              flex: 1,
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              minWidth: 0,
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid #f0f0f0",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {selectedRoomId != null
                ? (rooms.find((r) => r.idx === selectedRoomId)?.title ??
                  userRooms.find((r) => r.idx === selectedRoomId)?.title ??
                  `${selectedRoomId}번 대화방`)
                : "방을 선택하세요"}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#fff",
              }}
            >
              {selectedRoomId == null && (
                <div style={{ color: "#999", fontSize: 13, marginTop: 40, textAlign: "center" }}>
                  왼쪽에서 대화방 또는 유저→방을 선택하면 대화 내용이 표시됩니다.
                </div>
              )}
              {msgLoading && <div style={{ color: "#888", fontSize: 12 }}>메시지 불러오는 중…</div>}
              {!msgLoading &&
                selectedRoomId != null &&
                messages.map((m) => {
                  const mine = m.sender?.nickname === adminNickname;
                  return (
                    <div
                      key={m.idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        maxWidth: "75%",
                        alignSelf: mine ? "flex-end" : "flex-start",
                        alignItems: mine ? "flex-end" : "flex-start",
                      }}
                    >
                      {!mine && (
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>
                          {m.sender?.nickname ?? `user#${m.sender_id}`}
                        </div>
                      )}
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: 14,
                          fontSize: 13,
                          lineHeight: 1.4,
                          background: mine ? "#111" : "#f1f1f3",
                          color: mine ? "#fff" : "#111",
                          borderBottomRightRadius: mine ? 4 : 14,
                          borderBottomLeftRadius: mine ? 14 : 4,
                          wordBreak: "break-word",
                        }}
                      >
                        {m.content}
                      </div>
                      <div style={{ fontSize: 9, color: "#aaa", marginTop: 2 }}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  );
                })}
              <div ref={bottomRef} />
            </div>

            {selectedRoomId != null && (
              <div
                style={{
                  padding: 12,
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "#f1f1f3",
                    borderRadius: 20,
                    padding: "0 12px",
                  }}
                >
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSend();
                    }}
                    placeholder="관리자 메시지 입력..."
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px 0",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !content.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    cursor: "pointer",
                    opacity: sending || !content.trim() ? 0.5 : 1,
                  }}
                >
                  ↑
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}