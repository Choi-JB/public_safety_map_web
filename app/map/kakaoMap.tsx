"use client";

import { useEffect, useRef, useState } from "react";
import { get } from "@/lib/api/client";
import type {
  CityEventItem,
  GridDetail,
  GridItem,
  InfrastructureItem,
  InfraType,
  ReportItem,
} from "@/lib/api/types";

import { loadKakaoMap } from "./loadkakaoMap";
import { gridRectanglePath, safetyGradeColor } from "./gridStyle";
import { useMapStore } from "@/store/mapStore";
import GridInfoCard from "./GridInfoCard";
import { useAdminStore } from "@/store/adminStore";


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

const MAX_ZOOM_OUT = 7;
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

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
  //events
  const cityEventMarkersRef = useRef<any[]>([]);
  const activeCityEventIwRef = useRef<{ id: number; iw: any } | null>(null);
  const setCityEvents = useMapStore((s) => s.setCityEvents);
  const setCityEventsLoading = useMapStore((s) => s.setCityEventsLoading);
  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const setSelectedGridId = useMapStore((s) => s.setSelectedGridId);
  const infraType = useMapStore((s) => s.infraType);
  const setInfraType = useMapStore((s) => s.setInfraType);
  const setInfrastructures = useMapStore((s) => s.setInfrastructures);

  const setGridDetail = useMapStore((s) => s.setGridDetail);
  const setDetailLoading = useMapStore((s) => s.setDetailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);

  //reports
  const reportMarkersRef = useRef<any[]>([]);
  const activeReportIwRef = useRef<{ id: number; iw: any } | null>(null);
  const setReports = useMapStore((s) => s.setReports);
  const setReportsLoading = useMapStore((s) => s.setReportsLoading);

  //admin
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const focusMarkerRef = useRef<any>(null);

  const [query, setQuery] = useState("");

  const moveMap = (lat: number, lng: number, level = 6) => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;
    if (!map || !kakao) return;
    map.setLevel(level);
    map.setCenter(new kakao.maps.LatLng(lat, lng));
  };

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearSelection();
        moveMap(coords.latitude, coords.longitude, 5);
      },
      (error) => {
        console.error("현재 위치를 가져오지 못했습니다.", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const moveToCity = (lat: number, lng: number) => {
    clearSelection();
    moveMap(lat, lng, 6);
  };

  const searchAddress = () => {
    const kakao = kakaoRef.current;
    if (!kakao || !query.trim()) return;

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(query.trim(), (result: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        clearSelection();
        moveMap(Number(result[0].y), Number(result[0].x), 5);
        return;
      }

      const places = new kakao.maps.services.Places();
      places.keywordSearch(query.trim(), (data: any[], status2: string) => {
        if (status2 === kakao.maps.services.Status.OK && data[0]) {
          clearSelection();
          moveMap(Number(data[0].y), Number(data[0].x), 5);
        } else {
          alert("검색 결과가 없습니다.");
        }
      });
    });
  };

  // 1) 지도 + bounds + 최초 GPS
  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        const kakao = await loadKakaoMap();
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;
        const center = new kakao.maps.LatLng(
          DEFAULT_CENTER.lat,
          DEFAULT_CENTER.lng
        );
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

        // 지도 먼저 띄운 뒤 GPS로 이동 (실패 시 서울 유지)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              if (cancelled || !mapRef.current) return;
              map.setCenter(
                new kakao.maps.LatLng(coords.latitude, coords.longitude)
              );
              map.setLevel(5);
            },
            () => {
              // 거부/실패 → 기본 서울 유지
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        }
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
            const current = useMapStore.getState().selectedGridId;
            if (current === g.grid_id) clearSelection();
            else setSelectedGridId(g.grid_id);
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

  //2.5) 뷰포인트 이벤트
  useEffect(() => {
    if (!bounds || !mapRef.current || !kakaoRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        setCityEventsLoading(true);
        const params = new URLSearchParams({
          sw_lat: String(bounds.sw_lat),
          sw_lng: String(bounds.sw_lng),
          ne_lat: String(bounds.ne_lat),
          ne_lng: String(bounds.ne_lng),
        });
        const events = await get<CityEventItem[]>(`/city-events?${params}`);
        if (cancelled) return;
        setCityEvents(events);
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        activeCityEventIwRef.current?.iw.close();
        activeCityEventIwRef.current = null;
        cityEventMarkersRef.current.forEach((m) => m.setMap(null));
        cityEventMarkersRef.current = [];
        events.forEach((e) => {
          if (e.lat == null || e.lng == null) return;
          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(e.lat, e.lng),
            title: e.title ?? e.type ?? "도시정보",
          });
          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:8px;max-width:220px;">
            <strong>${e.type ?? ""}</strong><br/>
            ${e.title ?? ""}<br/>
            <small>${e.start_at ?? ""} ~ ${e.end_at ?? ""}</small>
          </div>`,
          });
          kakao.maps.event.addListener(marker, "click", () => {
            const active = activeCityEventIwRef.current;

            if (active?.id === e.id) {
              active.iw.close();
              activeCityEventIwRef.current = null;
              return;
            }

            active?.iw.close();
            iw.open(map, marker);
            activeCityEventIwRef.current = { id: e.id, iw };
          });
          cityEventMarkersRef.current.push(marker);
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setCityEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bounds, setGridsLoading, setCityEvents, setCityEventsLoading]);

  // 2.6) viewport reports
  useEffect(() => {
    if (!bounds || !mapRef.current || !kakaoRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setReportsLoading(true);
        const params = new URLSearchParams({
          sw_lat: String(bounds.sw_lat),
          sw_lng: String(bounds.sw_lng),
          ne_lat: String(bounds.ne_lat),
          ne_lng: String(bounds.ne_lng),
        });
        const reports = await get<ReportItem[]>(`/reports?${params}`);
        if (cancelled) return;

        setReports(reports);

        const kakao = kakaoRef.current;
        const map = mapRef.current;

        activeReportIwRef.current?.iw.close();
        activeReportIwRef.current = null;
        reportMarkersRef.current.forEach((m) => m.setMap(null));
        reportMarkersRef.current = [];

        reports.forEach((r) => {
          if (r.lat == null || r.lng == null) return;

          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(r.lat, r.lng),
            title: r.type ?? "제보",
          });

          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:8px;max-width:220px;">
            <strong>${r.type ?? "제보"}</strong><br/>
            ${r.description ?? ""}<br/>
            <small>${r.user_nickname ?? ""} · ~${r.expire_at ?? ""}</small>
          </div>`,
          });

          kakao.maps.event.addListener(marker, "click", () => {
            const active = activeReportIwRef.current;
            if (active?.id === r.id) {
              active.iw.close();
              activeReportIwRef.current = null;
              return;
            }
            active?.iw.close();
            iw.open(map, marker);
            activeReportIwRef.current = { id: r.id, iw };
          });

          reportMarkersRef.current.push(marker);
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setReportsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bounds, setReports, setReportsLoading]);

  // 3) 선택 격자 → 인프라 전체 로드 + 필터된 마커
  useEffect(() => {
    if (!selectedGridId || !mapRef.current || !kakaoRef.current) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // 항상 전체 (집계용)
        const items = await get<InfrastructureItem[]>(
          `/grids/${selectedGridId}/infrastructures`
        );
        if (cancelled) return;

        setInfrastructures(items);

        const kakao = kakaoRef.current;
        const map = mapRef.current;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // 마커만 필터
        const visible =
          infraType == null
            ? items
            : items.filter((i) => i.type === infraType);

        visible.forEach((item) => {
          if (item.lat == null || item.lng == null) return;

          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(item.lat, item.lng),
            title: `${item.type ?? ""} ${item.address ?? ""}`.trim(),
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

  // 4) 선택 격자 → 인포카드 detail
  useEffect(() => {
    if (!selectedGridId) {
      setGridDetail(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setDetailLoading(true);
        const detail = await get<GridDetail>(
          `/grids/${selectedGridId}/detail`
        );
        if (cancelled) return;
        setGridDetail(detail);
      } catch (error) {
        console.error(error);
        if (!cancelled) setGridDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedGridId, setGridDetail, setDetailLoading]);

  //관리자페이지 mapFocus 변경 시 지도 이동
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    // 이전 포커스 마커 제거
    focusMarkerRef.current?.setMap(null);
    focusMarkerRef.current = null;

    if (!mapFocus) return;

    moveMap(mapFocus.lat, mapFocus.lng, 6);

    var marker = new kakao.maps.Marker({
      map,
      position: new kakao.maps.LatLng(mapFocus.lat, mapFocus.lng),
      title: mapFocus.description,
    });
    focusMarkerRef.current = marker;
  }, [mapFocus]);

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
            if (e.key === "Enter") searchAddress();
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
        <button
          type="button"
          onClick={searchAddress}
          style={{
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          검색
        </button>

        <button
          type="button"
          onClick={moveToCurrentLocation}
          style={{
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          내 위치
        </button>

        <select
          defaultValue=""
          onChange={(e) => {
            const city = CITY_PRESETS.find((c) => c.name === e.target.value);
            if (city) moveToCity(city.lat, city.lng);
            e.target.value = "";
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 12,
            background: "#fff",
          }}
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


      <GridInfoCard />
    </div>
  );
}