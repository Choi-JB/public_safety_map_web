"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  SIDE_DETAIL_WIDTH,
  SIDE_PANEL_SLIDE_MS,
  SIDE_RAIL_WIDTH,
  useMapStore,
} from "@/store/mapStore";
import { get } from "@/lib/api/client";
import type { CityEventItem, InfrastructureItem } from "@/lib/api/types";
import styles from "./CityEventsPanel.module.css";


/** description에서 "장소:" 이후(주소 블록) 제거 */
function stripPlaceFromDescription(description: string | null) {
  if (!description) return null;
  const idx = description.search(/\n?\s*장소\s*:/);
  const text = (idx >= 0 ? description.slice(0, idx) : description)
    .replace(/\+/g, ", ")
    .trim();
  return text.length > 0 ? text : null;
}

/** 3일 이내 시작 예정 배지 기준 */
const SOON_DAYS = 3;
const HANDLE_WIDTH = 14;

/** 상세 패널 오른쪽 여닫기 핸들 — 양끝 라운드 세로 선(캡슐) */
const handleStyle: CSSProperties = {
  position: "absolute",
  right: -HANDLE_WIDTH / 2,
  top: "50%",
  transform: "translateY(-50%)",
  width: HANDLE_WIDTH,
  height: 56,
  border: "none",
  borderRadius: 999,
  background: "#cbd5e1",
  color: "#64748b",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 700,
  zIndex: 2,
  padding: 0,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "auto",
  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
};

type PanelTab = "grid" | "events";

/** 카드 공통 스타일 (격자 / 행사 동일) */
const cardStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  marginBottom: 8,
  border: "1px solid #e5e7eb",
  borderRadius: "12px 24px 24px 12px",
  padding: 10,
  background: "#fff",
  boxSizing: "border-box",
};

function isStartingWithinDays(startAt: string | null, days: number) {
  if (!startAt) return false;
  const now = new Date();
  const start = new Date(startAt);
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
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

/** 오른쪽 세로 레일 버튼 (네이버맵 스타일: 아이콘 + 라벨) */
function RailButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        width: "100%",
        padding: "12px 2px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: active ? "#2563eb" : "transparent",
        color: active ? "#fff" : "#374151",
        fontSize: 11,
        fontWeight: active ? 700 : 500,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

/**
 * 왼쪽 패널 (레일 + 상세)
 * - 맨 왼쪽: 세로 아이콘 레일 (격자 / 행사)
 * - 레일 오른쪽: 상세 패널 슬라이드
 * - sidePanelOpen → MapControls left와 동기
 * - 체감안전도 미표시
 */
export default function CityEventsPanel() {
  // --- 격자 ---
  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const gridDetail = useMapStore((s) => s.gridDetail);
  const detailLoading = useMapStore((s) => s.detailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);
  /** 격자 탭 타입별 개수 — 지도 마커 store와 분리 (격자 API) */
  const [gridInfras, setGridInfras] = useState<InfrastructureItem[]>([]);

  useEffect(() => {
    if (selectedGridId == null) {
      setGridInfras([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await get<InfrastructureItem[]>(
          `/grids/${selectedGridId}/infrastructures`
        );
        if (!cancelled) setGridInfras(items);
      } catch (e) {
        console.error(e);
        if (!cancelled) setGridInfras([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGridId]);

  // --- 행사 ---
  const events = useMapStore((s) => s.cityEvents);
  const loading = useMapStore((s) => s.cityEventsLoading);
  const moveTo = useMapStore((s) => s.moveTo);
  const selectedEventId = useMapStore((s) => s.selectedEventId);
  const setSelectedEventId = useMapStore((s) => s.setSelectedEventId);

  const sidePanelOpen = useMapStore((s) => s.sidePanelOpen);
  const setSidePanelOpen = useMapStore((s) => s.setSidePanelOpen);
  const sidePanelTab = useMapStore((s) => s.sidePanelTab);
  const setSidePanelTab = useMapStore((s) => s.setSidePanelTab);
  const selectedEventCardRef = useRef<HTMLButtonElement | null>(null);

  // 선택한 행사 카드로 스크롤
  useEffect(() => {
    if (sidePanelTab !== "events" || selectedEventId == null || !sidePanelOpen) {
      return;
    }
    selectedEventCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [sidePanelTab, selectedEventId, sidePanelOpen, events]);

  /** 레일 클릭: 다른 메뉴면 전환·열기, 같은 메뉴면 접기/펼치기 */
  const onRailClick = (next: PanelTab) => {
    if (sidePanelTab === next && sidePanelOpen) {
      setSidePanelOpen(false);
      return;
    }
    setSidePanelTab(next);
    setSidePanelOpen(true);
  };

  const selectEvent = (e: CityEventItem) => {
    setSelectedEventId(e.id);
    setSidePanelTab("events");
    setSidePanelOpen(true);
    if (e.lat != null && e.lng != null) moveTo?.(e.lat, e.lng, 4);
  };

  const withCoord = (i: InfrastructureItem) => i.lat != null && i.lng != null;
  const infraStats = {
    CCTV: gridInfras.filter((i) => i.type === "CCTV" && withCoord(i)).length,
    경찰서: gridInfras.filter((i) => i.type === "경찰서" && withCoord(i)).length,
    소방서: gridInfras.filter((i) => i.type === "소방서" && withCoord(i)).length,
    편의점: gridInfras.filter((i) => i.type === "편의점" && withCoord(i)).length,
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const at = a.start_at ? new Date(a.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.start_at ? new Date(b.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt;
    });
  }, [events]);

  const now = new Date();

  const upcoming = useMemo(
    () =>
      sortedEvents.filter((e) => {
        if (!e.start_at) return false;
        return new Date(e.start_at) > now;
      }),
    [sortedEvents, now]
  );

  const current = useMemo(
    () =>
      sortedEvents.filter((e) => {
        if (!e.start_at) return true;
        return new Date(e.start_at) <= now;
      }),
    [sortedEvents, now]
  );

  const detailOpen = sidePanelOpen;

  return (
    <aside
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 11,
        display: "flex",
        flexDirection: "row",
        pointerEvents: "none",
      }}
    >
      {/* 세로 레일 (맨 왼쪽, 항상 표시) */}
      <nav
        style={{
          position: "relative",
          width: SIDE_RAIL_WIDTH,
          height: "100%",
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          boxShadow: detailOpen ? "none" : "2px 0 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "10px 4px",
          gap: 4,
          pointerEvents: "auto",
          zIndex: 1,
        }}
      >
        <RailButton
          active={detailOpen && sidePanelTab === "grid"}
          label="격자"
          icon="▦"
          onClick={() => onRailClick("grid")}
        />
        <RailButton
          active={detailOpen && sidePanelTab === "events"}
          label="행사"
          icon="◎"
          onClick={() => onRailClick("events")}
        />
      </nav>

      {/* 상세 패널: 레일 오른쪽, 슬라이드 */}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          pointerEvents: "auto",
        }}
      >
        <div
          className={styles.slideWrap}
          style={{
            width: detailOpen ? SIDE_DETAIL_WIDTH : 0,
            transitionDuration: `${SIDE_PANEL_SLIDE_MS}ms`,
          }}
        >
          <div className={styles.slideInner} style={{ width: SIDE_DETAIL_WIDTH }}>
            <div
              style={{
                flexShrink: 0,
                padding: "12px 18px 12px 14px",
                borderBottom: "1px solid #eee",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {sidePanelTab === "grid" ? "격자 정보" : "행사 정보"}
            </div>

            <div
              className={styles.scrollHide}
              style={{ flex: 1, minHeight: 0, padding: "12px 20px 12px 12px" }}
            >
            {/* ========== 격자 ========== */}
            {sidePanelTab === "grid" && (
              <>
                {selectedGridId == null && (
                  <div style={{ fontSize: 12, color: "#666" }}>격자를 선택하세요</div>
                )}

                {selectedGridId != null && detailLoading && (
                  <div style={{ fontSize: 12, color: "#666" }}>불러오는 중…</div>
                )}

                {selectedGridId != null && !detailLoading && (
                  <div style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>격자 #{selectedGridId}</strong>
                      <button
                        type="button"
                        onClick={clearSelection}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          background: "#fff",
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        닫기
                      </button>
                    </div>

                    {gridDetail ? (
                      <>
                        <div style={{ fontSize: 12, marginTop: 8 }}>
                          안전등급: <b>{gridDetail.safety_grade ?? "-"}</b>
                          <span style={{ color: "#94a3b8", margin: "0 6px" }}>·</span>
                          인프라 {gridDetail.infra_count ?? gridInfras.length}
                        </div>

                        <div style={{ fontSize: 12, marginTop: 6, color: "#374151" }}>
                          CCTV {infraStats.CCTV} · 경찰서 {infraStats.경찰서} · 소방서{" "}
                          {infraStats.소방서} · 편의점 {infraStats.편의점}
                        </div>

                        <div style={{ fontSize: 12, marginTop: 10, marginBottom: 4 }}>태그</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {gridDetail.tags.length === 0 && (
                            <span style={{ fontSize: 12, color: "#666" }}>없음</span>
                          )}
                          {gridDetail.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                background: "#f1f5f9",
                                borderRadius: 999,
                                padding: "2px 8px",
                                fontSize: 12,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 체감안전도 제외 */}
                        <div style={{ fontSize: 12, marginTop: 12, marginBottom: 4 }}>
                          활성 제보
                        </div>
                        {gridDetail.active_reports.length === 0 && (
                          <div style={{ fontSize: 12, color: "#666" }}>없음</div>
                        )}
                        {gridDetail.active_reports.map((r) => (
                          <div key={r.id} style={{ fontSize: 12, marginTop: 4 }}>
                            [{r.type ?? "-"}] {r.description ?? ""}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                        상세 정보를 불러오지 못했습니다.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ========== 행사 ========== */}
            {sidePanelTab === "events" && (
              <>
                {loading && (
                  <div style={{ fontSize: 12, color: "#666" }}>행사 불러오는 중...</div>
                )}

                {!loading && current.length === 0 && upcoming.length === 0 && (
                  <div style={{ fontSize: 12, color: "#666" }}>표시할 행사가 없습니다.</div>
                )}
                {current.map((e) => {
                  const soon = isStartingWithinDays(e.start_at, SOON_DAYS);
                  const selected = e.id === selectedEventId;

                  return (
                    <button
                      key={e.id}
                      ref={selected ? selectedEventCardRef : undefined}
                      type="button"
                      onClick={() => selectEvent(e)}
                      style={{
                        ...cardStyle,
                        cursor: "pointer",
                        background: selected ? "#fdf2f8" : soon ? "#f3f4f6" : "#fff",
                        border: selected
                          ? "2px solid #ec4899"
                          : "1px solid #e5e7eb",
                      }}
                    >
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
                      {(() => {
                        const desc = stripPlaceFromDescription(e.description);
                        return desc ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginTop: 6,
                              whiteSpace: "pre-line",
                            }}
                          >
                            {desc}
                          </div>
                        ) : null;
                      })()}
                      
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

                  {upcoming.map((e) => {
                    const selected = e.id === selectedEventId;
                    return (
                      <button
                        key={`upcoming-${e.id}`}
                        ref={selected ? selectedEventCardRef : undefined}
                        type="button"
                        onClick={() => selectEvent(e)}
                        style={{
                          ...cardStyle,
                          marginTop: 8,
                          marginBottom: 0,
                          cursor: "pointer",
                          background: selected ? "#fdf2f8" : "#f3f4f6",
                          border: selected
                            ? "2px solid #ec4899"
                            : "1px solid #e5e7eb",
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
                        {(() => {
                          const desc = stripPlaceFromDescription(e.description);
                          return desc ? (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                                marginTop: 6,
                                whiteSpace: "pre-line",
                              }}
                            >
                              {desc}
                            </div>
                          ) : null;
                        })()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* 여닫기 핸들 — 상세 오른쪽 가장자리 */}
        <button
          type="button"
          onClick={() => setSidePanelOpen(!detailOpen)}
          aria-label={detailOpen ? "패널 접기" : "패널 펼치기"}
          style={handleStyle}
        >
          {detailOpen ? "<" : ">"}
        </button>
      </div>
    </aside>
  );
}
