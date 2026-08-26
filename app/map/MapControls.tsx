"use client";

import { useState, type CSSProperties } from "react";
import type { AccidentZoneType, InfraType } from "@/lib/api/types";
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
  ACCIDENT_ZONE_TYPES,
  ACCIDENT_ZONE_LABEL,
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

function accidentColorDot(type: AccidentZoneType) {
  switch (type) {
    case "pedestrian":
      return "#dc2626";
    case "bicycle":
      return "#2563eb";
    case "motorcycle":
      return "#7c3aed";
    case "schoolzone":
      return "#ea580c";
  }
}

/** 레이어가 실제로 표시 중인지 (마스터 ON + 선택 항목 ≥ 1) */
function isLayerActive(visible: boolean, selectedCount: number) {
  return visible && selectedCount > 0;
}

function accidentChipLabel(
  visible: boolean,
  types: AccidentZoneType[]
) {
  if (!isLayerActive(visible, types.length)) return "위험구간";
  if (types.length === ACCIDENT_ZONE_TYPES.length) return "위험구간";
  if (types.length === 1) return `위험구간 · ${ACCIDENT_ZONE_LABEL[types[0]]}`;
  return `위험구간 · ${types.length}종`;
}

function nearbyChipLabel(
  infraVisible: boolean,
  visibleInfraTypes: InfraType[]
) {
  if (!isLayerActive(infraVisible, visibleInfraTypes.length)) return "주변";
  if (visibleInfraTypes.length === INFRA_TYPES.length) return "주변";
  if (visibleInfraTypes.length === 1) return `주변 · ${visibleInfraTypes[0]}`;
  return `주변 · ${visibleInfraTypes.length}종`;
}

function gridChipLabel(
  gridsVisible: boolean,
  visibleGrades: SafetyGrade[]
) {
  if (!isLayerActive(gridsVisible, visibleGrades.length)) return "격자";
  if (visibleGrades.length === SAFETY_GRADES.length) return "격자";
  if (visibleGrades.length === 1) return `격자 · ${visibleGrades[0]}`;
  return `격자 · ${visibleGrades.length}종`;
}

const chipActiveStyle: CSSProperties = {
  border: "1px solid #2563eb",
  background: "#eff6ff",
};

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

/** 현위치(십자 조준) 아이콘 */
function LocationCrosshairIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="5.5" stroke="#6b7280" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.6" fill="#6b7280" />
      <path
        d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


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
  const [locationHover, setLocationHover] = useState(false);

  const [accidentOpen, setAccidentOpen] = useState(false);

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

  const accidentZonesVisible = useMapStore((s) => s.accidentZonesVisible);
  const visibleAccidentTypes = useMapStore((s) => s.visibleAccidentTypes);
  const setAccidentZonesVisible = useMapStore((s) => s.setAccidentZonesVisible);
  const toggleVisibleAccidentType = useMapStore(
    (s) => s.toggleVisibleAccidentType
  );

  const left = adminMode
    ? 12
    : SIDE_RAIL_WIDTH +
      (sidePanelOpen ? SIDE_DETAIL_WIDTH : 0) +
      SIDE_PANEL_GAP;

  const nearbyActive = isLayerActive(infraVisible, visibleInfraTypes.length);
  const gridActive = isLayerActive(gridsVisible, visibleGrades.length);
  const accidentActive = isLayerActive(
    accidentZonesVisible,
    visibleAccidentTypes.length
  );

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

      {/* 현위치 */}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
        onMouseEnter={() => setLocationHover(true)}
        onMouseLeave={() => setLocationHover(false)}
      >
        <button
          type="button"
          onClick={() => moveToCurrentLocation?.()}
          aria-label="현위치"
          style={{
            width: 36,
            height: 36,
            padding: 0,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <LocationCrosshairIcon />
        </button>
        {locationHover && (
          <div
            role="tooltip"
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginTop: 8,
              padding: "6px 10px",
              background: "#374151",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            현위치
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -5,
                left: "50%",
                width: 0,
                height: 0,
                transform: "translateX(-50%)",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "5px solid #374151",
              }}
            />
          </div>
        )}
      </div>

      {/* 주변 → 표시 on/off + 타입 토글 */}
      <div style={{ position: "relative" }}>
        <div style={chipStyle}>
          <button
            type="button"
            onClick={() => {
              setNearbyOpen((v) => !v);
              setGridOpen(false);
              setAccidentOpen(false);
            }}
            aria-expanded={nearbyOpen}
            style={{
              ...actionBtnStyle,
              ...(nearbyActive ? chipActiveStyle : null),
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
              setAccidentOpen(false);
            }}
            aria-expanded={gridOpen}
            style={{
              ...actionBtnStyle,
              ...(gridActive ? chipActiveStyle : null),
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
            {/* 다발 → 표시 on/off + 타입 토글 */}
            <div style={{ position: "relative" }}>
        <div style={chipStyle}>
          <button
            type="button"
            onClick={() => {
              setAccidentOpen((v) => !v);
              setNearbyOpen(false);
              setGridOpen(false);
            }}
            aria-expanded={accidentOpen}
            style={{
              ...actionBtnStyle,
              ...(accidentActive ? chipActiveStyle : null),
            }}
          >
            {accidentChipLabel(accidentZonesVisible, visibleAccidentTypes)}
          </button>
        </div>

        {accidentOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              minWidth: 168,
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
              onClick={() => setAccidentZonesVisible(!accidentZonesVisible)}
              style={{
                ...actionBtnStyle,
                width: "100%",
                height: "auto",
                textAlign: "left",
                border: accidentZonesVisible
                  ? "1px solid #2563eb"
                  : "1px solid transparent",
                background: accidentZonesVisible ? "#eff6ff" : "#fff",
                fontWeight: 600,
              }}
            >
              위험구간 표시 {accidentZonesVisible ? "ON" : "OFF"}
            </button>

            <div
              style={{
                height: 1,
                background: "#e5e7eb",
                margin: "2px 0",
              }}
            />

            {ACCIDENT_ZONE_TYPES.map((type) => {
              const on = visibleAccidentTypes.includes(type);
              const disabled = !accidentZonesVisible;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleVisibleAccidentType(type)}
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
                      background: accidentColorDot(type),
                      flexShrink: 0,
                    }}
                  />
                  {ACCIDENT_ZONE_LABEL[type]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
