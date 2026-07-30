"use client";

import { useState, type CSSProperties } from "react";
import type { InfraType } from "@/lib/api/types";
import {
  SAFETY_GRADES,
  safetyGradeColor,
  type SafetyGrade,
} from "@/app/map/gridStyle";
import {
  INFRA_TYPES,
  SIDE_DETAIL_WIDTH,
  SIDE_PANEL_GAP,
  SIDE_PANEL_SLIDE_MS,
  SIDE_RAIL_WIDTH,
  useMapStore,
} from "@/store/mapStore";


function infraColorDot(type: InfraType) {
  switch (type) {
    case "CCTV":
      return "#0f766e";
    case "경찰서":
      return "#1d4ed8";
    case "소방서":
      return "#ea580c";
    case "편의점":
      return "#65a30d";
  }
}

function nearbyChipLabel(
  infraVisible: boolean,
  visibleInfraTypes: InfraType[]
) {
  if (!infraVisible) return "주변 · 숨김";
  if (visibleInfraTypes.length === INFRA_TYPES.length) return "주변";
  if (visibleInfraTypes.length === 0) return "주변 · 없음";
  if (visibleInfraTypes.length === 1) return `주변 · ${visibleInfraTypes[0]}`;
  return `주변 · ${visibleInfraTypes.length}종`;
}

function gridChipLabel(
  gridsVisible: boolean,
  visibleGrades: SafetyGrade[]
) {
  if (!gridsVisible) return "격자 · 숨김";
  if (visibleGrades.length === SAFETY_GRADES.length) return "격자";
  if (visibleGrades.length === 0) return "격자 · 없음";
  if (visibleGrades.length === 1) return `격자 · ${visibleGrades[0]}`;
  return `격자 · ${visibleGrades.length}종`;
}

/** 분리된 칩(카드) 공통 스타일 */
const chipStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#fff",
  padding: "6px 8px",
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
};

/** 검색·내 위치·주변 공통 버튼 크기 (검색 기준) */
const actionBtnStyle: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
  height: 28,
  boxSizing: "border-box",
  lineHeight: 1,
};


type MapControlsProps = {
  adminMode?: boolean;
};

/**
 * 지도 상단 컨트롤
 * - 검색 / 내 위치 / 주변 / 격자 — 분리된 칩
 * - 왼쪽 사이드 패널 열림에 맞춰 left가 같이 슬라이드
 */
export default function MapControls({ adminMode = false }: MapControlsProps) {
  const [query, setQuery] = useState("");
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);

  const searchAddress = useMapStore((s) => s.searchAddress);
  const moveToCurrentLocation = useMapStore((s) => s.moveToCurrentLocation);
  const sidePanelOpen = useMapStore((s) => s.sidePanelOpen);
  const infraVisible = useMapStore((s) => s.infraVisible);
  const visibleInfraTypes = useMapStore((s) => s.visibleInfraTypes);
  const setInfraVisible = useMapStore((s) => s.setInfraVisible);
  const toggleVisibleInfraType = useMapStore((s) => s.toggleVisibleInfraType);
  const gridsVisible = useMapStore((s) => s.gridsVisible);
  const visibleGrades = useMapStore((s) => s.visibleGrades);
  const setGridsVisible = useMapStore((s) => s.setGridsVisible);
  const toggleVisibleGrade = useMapStore((s) => s.toggleVisibleGrade);

  const onSearch = () => searchAddress?.(query);

  const left = adminMode
    ? 12
    : SIDE_RAIL_WIDTH +
      (sidePanelOpen ? SIDE_DETAIL_WIDTH : 0) +
      SIDE_PANEL_GAP;


  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left,
        right: adminMode ? 12 : undefined,
        maxWidth: adminMode ? "calc(100% - 24px)" : undefined,
        zIndex: 10,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "flex-start",
        transition: adminMode
          ? undefined
          : `left ${SIDE_PANEL_SLIDE_MS}ms ease`,
      }}
    >
      {/* 검색 */}
      <div style={chipStyle}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="주소 또는 장소 검색"
          style={{
            padding: "4px 8px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 12,
            width: 180,
            height: 28,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <button type="button" onClick={onSearch} style={actionBtnStyle}>
          검색
        </button>
      </div>

      {/* 내 위치 */}
      <div style={chipStyle}>
        <button
          type="button"
          onClick={() => moveToCurrentLocation?.()}
          style={actionBtnStyle}
        >
          내 위치
        </button>
      </div>

      {/* 주변 → 표시 on/off + 타입 토글 */}
      <div style={{ position: "relative" }}>
        <div style={chipStyle}>
          <button
            type="button"
            onClick={() => {
              setNearbyOpen((v) => !v);
              setGridOpen(false);
            }}
            aria-expanded={nearbyOpen}
            style={{
              ...actionBtnStyle,
              border: nearbyOpen ? "1px solid #2563eb" : actionBtnStyle.border,
              background: nearbyOpen ? "#eff6ff" : "#fff",
            }}
          >
            {nearbyChipLabel(infraVisible, visibleInfraTypes)}
          </button>
        </div>

        {nearbyOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              minWidth: 148,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              padding: 8,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={() => setInfraVisible(!infraVisible)}
              style={{
                ...actionBtnStyle,
                width: "100%",
                height: "auto",
                textAlign: "left",
                border: infraVisible
                  ? "1px solid #2563eb"
                  : "1px solid transparent",
                background: infraVisible ? "#eff6ff" : "#fff",
                fontWeight: 600,
              }}
            >
              주변 표시 {infraVisible ? "ON" : "OFF"}
            </button>

            <div
              style={{
                height: 1,
                background: "#e5e7eb",
                margin: "2px 0",
              }}
            />

            {INFRA_TYPES.map((type) => {
              const on = visibleInfraTypes.includes(type);
              const disabled = !infraVisible;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleVisibleInfraType(type)}
                  style={{
                    ...actionBtnStyle,
                    width: "100%",
                    height: "auto",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    border:
                      on && !disabled
                        ? "1px solid #2563eb"
                        : "1px solid transparent",
                    background: on && !disabled ? "#eff6ff" : "#fff",
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: infraColorDot(type),
                      flexShrink: 0,
                    }}
                  />
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 격자 → 표시 on/off + 등급 필터 */}
      <div style={{ position: "relative" }}>
        <div style={chipStyle}>
          <button
            type="button"
            onClick={() => {
              setGridOpen((v) => !v);
              setNearbyOpen(false);
            }}
            aria-expanded={gridOpen}
            style={{
              ...actionBtnStyle,
              border: gridOpen ? "1px solid #2563eb" : actionBtnStyle.border,
              background: gridOpen ? "#eff6ff" : "#fff",
            }}
          >
            {gridChipLabel(gridsVisible, visibleGrades)}
          </button>
        </div>

        {gridOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              minWidth: 148,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              padding: 8,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={() => setGridsVisible(!gridsVisible)}
              style={{
                ...actionBtnStyle,
                width: "100%",
                height: "auto",
                textAlign: "left",
                border: gridsVisible
                  ? "1px solid #2563eb"
                  : "1px solid transparent",
                background: gridsVisible ? "#eff6ff" : "#fff",
                fontWeight: 600,
              }}
            >
              격자 표시 {gridsVisible ? "ON" : "OFF"}
            </button>

            <div
              style={{
                height: 1,
                background: "#e5e7eb",
                margin: "2px 0",
              }}
            />

            {SAFETY_GRADES.map((grade) => {
              const on = visibleGrades.includes(grade);
              const disabled = !gridsVisible;
              return (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleVisibleGrade(grade)}
                  style={{
                    ...actionBtnStyle,
                    width: "100%",
                    height: "auto",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    border:
                      on && !disabled
                        ? "1px solid #2563eb"
                        : "1px solid transparent",
                    background: on && !disabled ? "#eff6ff" : "#fff",
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: safetyGradeColor(grade),
                      flexShrink: 0,
                    }}
                  />
                  {grade}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
