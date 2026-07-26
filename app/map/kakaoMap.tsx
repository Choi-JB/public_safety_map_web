"use client";

import { useEffect, useRef } from "react";
import { get } from "@/lib/api/client";
import type { GridItem, InfrastructureItem, InfraType } from "@/lib/api/types";
import { loadKakaoMap } from "./loadkakaoMap";
import { gridRectanglePath, safetyGradeColor } from "./gridStyle";
import { useMapStore } from "@/store/mapStore";

const INFRA_TYPES: Array<InfraType | null> = [
  null,
  "CCTV",
  "경찰서",
  "소방서",
  "편의점",
];  

// 지도 축소 제한
const MAX_ZOOM_OUT = 7;

function infraTypeLabel(t: InfraType | null) {
  return t === null ? "전체" : t;
}

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const kakaoRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);

  const setBounds = useMapStore((s) => s.setBounds);
  const bounds = useMapStore((s) => s.bounds);
  const setGrids = useMapStore((s) => s.setGrids);
  const setGridsLoading = useMapStore((s) => s.setGridsLoading);

  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const setSelectedGridId = useMapStore((s) => s.setSelectedGridId);
  const infraType = useMapStore((s) => s.infraType);
  const setInfraType = useMapStore((s) => s.setInfraType);
  const setInfrastructures = useMapStore((s) => s.setInfrastructures);

  // 1) 지도 + bounds
  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        const kakao = await loadKakaoMap();
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;
        const center = new kakao.maps.LatLng(37.5665, 126.978);
        const map = new kakao.maps.Map(containerRef.current, {
          center,
          level: 6,
        });

        map.setMaxLevel(MAX_ZOOM_OUT);

        

        mapRef.current = map;

        const updateBounds = () => {
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          setBounds({
            sw_lat: sw.getLat(),
            sw_lng: sw.getLng(),
            ne_lat: ne.getLat(),
            ne_lng: ne.getLng(),
          });
        };

        kakao.maps.event.addListener(map, "idle", () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(updateBounds, 300);
        });

        updateBounds();
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [setBounds]);

  // 2) 격자 Polygon + 클릭
  useEffect(() => {
    if (!bounds || !mapRef.current || !kakaoRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setGridsLoading(true);
        const params = new URLSearchParams({
          sw_lat: String(bounds.sw_lat),
          sw_lng: String(bounds.sw_lng),
          ne_lat: String(bounds.ne_lat),
          ne_lng: String(bounds.ne_lng),
        });
        const grids = await get<GridItem[]>(`/grids?${params}`);
        if (cancelled) return;

        setGrids(grids);

        const kakao = kakaoRef.current;
        const map = mapRef.current;

        polygonsRef.current.forEach((p) => p.setMap(null));
        polygonsRef.current = [];

        grids.forEach((g) => {
          if (g.lat == null || g.lng == null) return;

          const path = gridRectanglePath(g.lat, g.lng).map(
            (p) => new kakao.maps.LatLng(p.lat, p.lng)
          );

          const polygon = new kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 1,
            strokeColor: safetyGradeColor(g.safety_grade),
            strokeOpacity: 0.8,
            fillColor: safetyGradeColor(g.safety_grade),
            fillOpacity: 0.25,
          });

          kakao.maps.event.addListener(polygon, "click", () => {
            setSelectedGridId(g.grid_id);
          });

          polygonsRef.current.push(polygon);
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setGridsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bounds, setGrids, setGridsLoading, setSelectedGridId]);

  // 3) 선택 격자 → 인프라 마커
  useEffect(() => {
    if (!selectedGridId || !mapRef.current || !kakaoRef.current) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const qs =
          infraType != null
            ? `?type=${encodeURIComponent(infraType)}`
            : "";
        const items = await get<InfrastructureItem[]>(
          `/grids/${selectedGridId}/infrastructures${qs}`
        );
        if (cancelled) return;

        setInfrastructures(items);

        const kakao = kakaoRef.current;
        const map = mapRef.current;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        items.forEach((item) => {
          if (item.lat == null || item.lng == null) return;

          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(item.lat, item.lng),
            title: `${item.type} ${item.address ?? ""}`.trim(),
          });
          markersRef.current.push(marker);
        });
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedGridId, infraType, setInfrastructures]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          background: "#fff",
          padding: 8,
          borderRadius: 8,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {INFRA_TYPES.map((t) => (
          <button
            key={infraTypeLabel(t)}
            type="button"
            onClick={() => setInfraType(t)}
            style={{
              padding: "4px 8px",
              border:
                infraType === t ? "2px solid #2563eb" : "1px solid #ccc",
              borderRadius: 6,
              background: infraType === t ? "#eff6ff" : "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {infraTypeLabel(t)}
          </button>
        ))}
        {selectedGridId != null && (
          <span style={{ fontSize: 12, alignSelf: "center", marginLeft: 4 }}>
            선택 격자: {selectedGridId}
          </span>
        )}
      </div>
    </div>
  );
}


