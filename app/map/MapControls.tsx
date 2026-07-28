"use client";

import { useState } from "react";
import type { InfraType } from "@/lib/api/types";
import { useMapStore } from "@/store/mapStore";

const INFRA_TYPES: Array<InfraType | null> = [
  null,
  "CCTV",
  "경찰서",
  "소방서",
  "편의점",
];

const CITY_PRESETS = [
  { name: "서울", lat: 37.5665, lng: 126.978 },
  { name: "부산", lat: 35.1796, lng: 129.0756 },
  { name: "대구", lat: 35.8714, lng: 128.6014 },
  { name: "인천", lat: 37.4563, lng: 126.7052 },
  { name: "광주", lat: 35.1595, lng: 126.8526 },
  { name: "대전", lat: 36.3504, lng: 127.3845 },
  { name: "울산", lat: 35.5384, lng: 129.3114 },
  { name: "제주", lat: 33.4996, lng: 126.5312 },
] as const;

function infraTypeLabel(t: InfraType | null) {
  return t === null ? "전체" : t;
}

const btnStyle: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

export default function MapControls() {
  const [query, setQuery] = useState("");

  const searchAddress = useMapStore((s) => s.searchAddress);
  const moveToCurrentLocation = useMapStore((s) => s.moveToCurrentLocation);
  const moveTo = useMapStore((s) => s.moveTo);
  const infraType = useMapStore((s) => s.infraType);
  const setInfraType = useMapStore((s) => s.setInfraType);
  const selectedGridId = useMapStore((s) => s.selectedGridId);

  const onSearch = () => searchAddress?.(query);

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "center",
        background: "#fff",
        padding: 8,
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        placeholder="주소 또는 장소 검색"
        style={{
          padding: "4px 8px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 12,
          width: 180,
        }}
      />
      <button type="button" onClick={onSearch} style={btnStyle}>
        검색
      </button>

      <button
        type="button"
        onClick={() => moveToCurrentLocation?.()}
        style={btnStyle}
      >
        내 위치
      </button>

      <select
        defaultValue=""
        onChange={(e) => {
          const city = CITY_PRESETS.find((c) => c.name === e.target.value);
          if (city) moveTo?.(city.lat, city.lng, 6);
          e.target.value = "";
        }}
        style={{ ...btnStyle, background: "#fff" }}
      >
        <option value="" disabled>
          도시 이동
        </option>
        {CITY_PRESETS.map((city) => (
          <option key={city.name} value={city.name}>
            {city.name}
          </option>
        ))}
      </select>

      {INFRA_TYPES.map((t) => (
        <button
          key={infraTypeLabel(t)}
          type="button"
          onClick={() => setInfraType(t)}
          style={{
            ...btnStyle,
            border: infraType === t ? "2px solid #2563eb" : "1px solid #ccc",
            background: infraType === t ? "#eff6ff" : "#fff",
          }}
        >
          {infraTypeLabel(t)}
        </button>
      ))}

      {selectedGridId != null && (
        <span style={{ fontSize: 12, marginLeft: 4 }}>
          선택 격자: {selectedGridId}
        </span>
      )}
    </div>
  );
}
