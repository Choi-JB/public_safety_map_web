"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import type { InfrastructureItem } from "@/lib/api/types";

const PEEK_HEIGHT = 148;
const EXPANDED_HEIGHT = "62vh";

export default function GridInfoCard() {
  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const gridDetail = useMapStore((s) => s.gridDetail);
  const detailLoading = useMapStore((s) => s.detailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const infrastructures = useMapStore((s) => s.infrastructures);

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [selectedGridId]);

  const withCoord = (i: InfrastructureItem) =>
    i.lat != null && i.lng != null;

  const infraStats = {
    CCTV: infrastructures.filter((i) => i.type === "CCTV" && withCoord(i)).length,
    경찰서: infrastructures.filter((i) => i.type === "경찰서" && withCoord(i)).length,
    소방서: infrastructures.filter((i) => i.type === "소방서" && withCoord(i)).length,
    편의점: infrastructures.filter((i) => i.type === "편의점" && withCoord(i)).length,
  };

  if (selectedGridId == null) return null;

  return (
    <aside
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        height: expanded ? EXPANDED_HEIGHT : PEEK_HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.14)",
        fontSize: 13,
        transition: "height 0.22s ease",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? "인포카드 접기" : "인포카드 펼치기"}
        style={{
          flexShrink: 0,
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "10px 16px 6px",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "block",
            width: 40,
            height: 4,
            margin: "0 auto 10px",
            borderRadius: 999,
            background: "#cbd5e1",
          }}
        />
        <span
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          <strong style={{ fontSize: 14 }}>격자 #{selectedGridId}</strong>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {expanded ? "접기" : "펼치기"}
          </span>
        </span>
      </button>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: expanded ? "auto" : "hidden",
          padding: "4px 16px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {detailLoading ? (
            <span style={{ color: "#64748b" }}>불러오는 중…</span>
          ) : gridDetail ? (
            <span>
              안전등급: <b>{gridDetail.safety_grade ?? "-"}</b>
              <span style={{ color: "#94a3b8", margin: "0 6px" }}>·</span>
              인프라 {gridDetail.infra_count ?? infrastructures.length}
            </span>
          ) : (
            <span style={{ color: "#64748b" }}>상세 정보를 불러오지 못했습니다.</span>
          )}
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

        {!detailLoading && gridDetail && (
          <>
            <p style={{ margin: "0 0 4px" }}>
              CCTV {infraStats.CCTV} · 경찰서 {infraStats.경찰서} · 소방서{" "}
              {infraStats.소방서} · 편의점 {infraStats.편의점}
            </p>

            {expanded && (
              <>
                <p style={{ marginTop: 12, marginBottom: 4 }}>태그</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {gridDetail.tags.length === 0 && <span>없음</span>}
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

                <p style={{ marginTop: 12, marginBottom: 4 }}>체감안전도</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>안전 {gridDetail.safety_feeling_ratio.안전}%</li>
                  <li>보통 {gridDetail.safety_feeling_ratio.보통}%</li>
                  <li>불안 {gridDetail.safety_feeling_ratio.불안}%</li>
                </ul>

                <p style={{ marginTop: 12, marginBottom: 4 }}>최근 피드백</p>
                {gridDetail.recent_feedbacks.length === 0 && <p>없음</p>}
                {gridDetail.recent_feedbacks.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      borderTop: "1px solid #eee",
                      paddingTop: 6,
                      marginTop: 6,
                    }}
                  >
                    <div>{f.safety_feeling ?? "-"}</div>
                    <div style={{ color: "#555" }}>{f.comment ?? ""}</div>
                  </div>
                ))}

                <p style={{ marginTop: 12, marginBottom: 4 }}>활성 제보</p>
                {gridDetail.active_reports.length === 0 && <p>없음</p>}
                {gridDetail.active_reports.map((r) => (
                  <div key={r.id} style={{ marginTop: 4 }}>
                    [{r.type ?? "-"}] {r.description ?? ""}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
