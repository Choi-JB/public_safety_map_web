"use client";

import { useEffect, useRef } from "react";
import { get } from "@/lib/api/client";
import type { GridItem } from "@/lib/api/types";
import { loadKakaoMap } from "./loadkakaoMap";
import { gridRectanglePath, safetyGradeColor } from "./gridStyle";
import { useMapStore } from "@/store/mapStore";

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const kakaoRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);

  const setBounds = useMapStore((s) => s.setBounds);
  const bounds = useMapStore((s) => s.bounds);
  const setGrids = useMapStore((s) => s.setGrids);
  const setGridsLoading = useMapStore((s) => s.setGridsLoading);

  // 지도 생성 + bounds 갱신
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
          level: 5,
        });
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

  // bounds → GET /grids → 격자 오버레이
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
  }, [bounds, setGrids, setGridsLoading]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}