"use client";

import { useMapStore } from "@/store/mapStore";
import type { InfrastructureItem } from "@/lib/api/types";

export default function GridInfoCard() {
  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const gridDetail = useMapStore((s) => s.gridDetail);
  const detailLoading = useMapStore((s) => s.detailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const infrastructures = useMapStore((s) => s.infrastructures);

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
        top: 60,
        right: 12,
        zIndex: 10,
        width: 320,
        maxHeight: "calc(100vh - 80px)",
        overflow: "auto",
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
        padding: 14,
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong>격자 #{selectedGridId}</strong>
        <button type="button" onClick={clearSelection} style={{ cursor: "pointer" }}>
          닫기
        </button>
      </div>

      {detailLoading && <p>불러오는 중…</p>}

      {!detailLoading && !gridDetail && <p>상세 정보를 불러오지 못했습니다.</p>}

      {!detailLoading && gridDetail && (
        <>
          <p>
            안전등급: <b>{gridDetail.safety_grade ?? "-"}</b>
          </p>
          <p>인프라 수: {gridDetail.infra_count ?? infrastructures.length}</p>
          <p>CCTV: {infraStats.CCTV}</p>
          <p>경찰서: {infraStats.경찰서}</p>
          <p>소방서: {infraStats.소방서}</p>
          <p>편의점: {infraStats.편의점}</p>  

          <p style={{ marginTop: 10, marginBottom: 4 }}>태그</p>
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

          <p style={{ marginTop: 10, marginBottom: 4 }}>체감안전도</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>안전 {gridDetail.safety_feeling_ratio.안전}%</li>
            <li>보통 {gridDetail.safety_feeling_ratio.보통}%</li>
            <li>불안 {gridDetail.safety_feeling_ratio.불안}%</li>
          </ul>

          <p style={{ marginTop: 10, marginBottom: 4 }}>최근 피드백</p>
          {gridDetail.recent_feedbacks.length === 0 && <p>없음</p>}
          {gridDetail.recent_feedbacks.map((f) => (
            <div
              key={f.id}
              style={{ borderTop: "1px solid #eee", paddingTop: 6, marginTop: 6 }}
            >
              <div>{f.safety_feeling ?? "-"}</div>
              <div style={{ color: "#555" }}>{f.comment ?? ""}</div>
            </div>
          ))}

          <p style={{ marginTop: 10, marginBottom: 4 }}>활성 제보</p>
          {gridDetail.active_reports.length === 0 && <p>없음</p>}
          {gridDetail.active_reports.map((r) => (
            <div key={r.id} style={{ marginTop: 4 }}>
              [{r.type ?? "-"}] {r.description ?? ""}
            </div>
          ))}
        </>
      )}
    </aside>
  );
}