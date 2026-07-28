"use client";

import { useMemo, useState } from "react";
import { useMapStore } from "@/store/mapStore";

const SOON_DAYS = 3;

function isStartingWithinDays(startAt: string | null, days: number) {
  if (!startAt) return false;
  const now = new Date();
  const start = new Date(startAt);
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // 3일 이내 "시작 예정" 이벤트만 true (이미 시작한 건 제외)
  return start > now && start <= limit;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CityEventsPanel() {
  // 지도 viewport 기준으로 로드된 행사 목록
  const events = useMapStore((s) => s.cityEvents);
  const loading = useMapStore((s) => s.cityEventsLoading);
  const moveTo = useMapStore((s) => s.moveTo);

  // 우측 패널 접기/펼치기 상태
  const [collapsed, setCollapsed] = useState(false);

  // 시작일 오름차순 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const at = a.start_at ? new Date(a.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.start_at ? new Date(b.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt;
    });
  }, [events]);

  const now = new Date();

  // 시작 전 행사: start_at > now
  const upcoming = useMemo(
    () =>
      sortedEvents.filter((e) => {
        if (!e.start_at) return false;
        return new Date(e.start_at) > now;
      }),
    [sortedEvents, now]
  );

  // 이미 시작했거나 진행중(또는 start_at 없는 경우 포함)
  const current = useMemo(
    () =>
      sortedEvents.filter((e) => {
        if (!e.start_at) return true;
        return new Date(e.start_at) <= now;
      }),
    [sortedEvents, now]
  );


  return (
    <aside
      style={{
        position: "absolute",
        top: "50%",
        right: 0,
        zIndex: 11,
        width: 340, 
        maxHeight: "calc(100vh - 24px)",
        background: "#fff",
        borderRadius: "10px 0 0 10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        overflow: "visible",
        transform: collapsed
        ? "translate(calc(100% - 28px), -50%)"
        : "translate(0, -50%)",
        transition: "transform 0.22s ease",
      }}
    >
      {/* 오른쪽 슬라이드 패널 핸들 */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          position: "absolute",
          left: -28,
          top: "50%",
          transform: "translateY(-50%)",
          width: 20,
          height: 42,
          border: "1px solid #cbd5e1",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          background: "#e5e7eb",
          color: "#374151",
          cursor: "pointer",
          fontSize: 10,
          fontWeight: 700,
          zIndex: 1,
        }}
      >
        {collapsed ? "<<" : ">>"}
      </button>

      {/* 헤더: 제목 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid #eee",
        }}
      >
        <strong style={{ fontSize: 14 }}>행사 정보</strong>
      </div>

      {/* 본문: 접힌 경우 숨김 */}
      {!collapsed && (
        <div style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto", padding: 10 }}>
          {loading && <div style={{ fontSize: 12, color: "#666" }}>행사 불러오는 중...</div>}

          {!loading && current.length === 0 && upcoming.length === 0 && (
            <div style={{ fontSize: 12, color: "#666" }}>표시할 행사가 없습니다.</div>
          )}

          {current.map((e) => {
            // 3일 내 시작 이벤트인지 판단
            const soon = isStartingWithinDays(e.start_at, SOON_DAYS);

            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  // 행사 좌표가 있으면 해당 위치로 이동
                  if (e.lat != null && e.lng != null) moveTo?.(e.lat, e.lng, 5);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 8,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 10,
                  cursor: "pointer",
                  background: soon ? "#f3f4f6" : "#fff", // 3일 내 시작 행사 회색톤
                }}
              >
                {/* 3일 내 시작 안내 배지 */}
                {soon && (
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: 6,
                      fontSize: 11,
                      color: "#374151",
                      background: "#e5e7eb",
                      borderRadius: 9999,
                      padding: "2px 8px",
                    }}
                  >
                    3일 내 시작
                  </div>
                )}

                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {e.title ?? "(제목 없음)"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  {e.type ?? "행사"}
                </div>
                <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
                  {formatDateTime(e.start_at)} ~ {formatDateTime(e.end_at)}
                </div>
              </button>
            );
          })}

          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <strong style={{ fontSize: 13 }}>시작 전 행사</strong>

            {upcoming.length === 0 && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                시작 전 행사가 없습니다.
              </div>
            )}

            {upcoming.map((e) => (
              <button
                key={`upcoming-${e.id}`}
                type="button"
                onClick={() => {
                  if (e.lat != null && e.lng != null) moveTo?.(e.lat, e.lng, 5);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginTop: 8,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 10,
                  cursor: "pointer",
                  background: "#f3f4f6",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {e.title ?? "(제목 없음)"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  {e.type ?? "행사"}
                </div>
                <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
                  {formatDateTime(e.start_at)} ~ {formatDateTime(e.end_at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}