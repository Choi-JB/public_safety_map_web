"use client";

import { useEffect, useRef } from "react";
import { get } from "@/lib/api/client";
import type {
  CityEventItem,
  GridDetail,
  GridItem,
  InfraType,
  InfrastructureItem,
  ReportItem,
} from "@/lib/api/types";

import { loadKakaoMap } from "./loadkakaoMap";
import { gridRectanglePath, isSafetyGrade, safetyGradeColor } from "./gridStyle";
import { DEBUG_INFRA_RANGE_CIRCLE, levelToRadiusM } from "./infraRange";
import { useMapStore } from "@/store/mapStore";
import { useAdminStore } from "@/store/adminStore";

const MAX_ZOOM_OUT = 9; // --> 최대 줌 아웃 레벨
type Props = {
  enableGrid?: boolean; //기본 true
  interactive?: boolean; //기본 true - false면 드래그/줌 불가
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const CENTER_EVENT_RADIUS_KM = 10; // 행사 패널 표시 반경

// 마커 종류별 색상 정의
const MARKER_COLORS = {
  me: "#2563eb", // 내위치 — 파란
  report: "#dc2626", // report — 붉은
  infra: "#16a34a", // infra 기본 — 녹색
  event: "#ec4899", // 행사 — 분홍
} as const;

/** 인프라 타입별 핀 색 */
function infraColor(type: string | null) {
  switch (type) {
    case "CCTV":
      return "#0f766e";
    case "경찰서":
      return "#1d4ed8";
    case "소방서":
      return "#ea580c";
    case "편의점":
      return "#65a30d";
    default:
      return MARKER_COLORS.infra;
  }
}

/** 인프라 타입별 핀 안 글자 */
function infraLabel(type: string | null) {
  switch (type) {
    case "CCTV":
      return "C";
    case "경찰서":
      return "경";
    case "소방서":
      return "소";
    case "편의점":
      return "편";
    default:
      return undefined;
  }
}

/** SVG 핀 → 카카오 MarkerImage (label 있으면 흰 원에 글자) */
function createPinImage(kakao: any, color: string, label?: string) {
  const center = label
    ? `<circle cx="12" cy="12" r="5.5" fill="#fff"/><text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="700" fill="${color}" font-family="sans-serif">${label}</text>`
    : `<circle cx="12" cy="12" r="4.5" fill="#fff"/>`;

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
      <path fill="${color}" stroke="#fff" stroke-width="1.5"
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 23 12 23s12-14 12-23C24 5.4 18.6 0 12 0z"/>
      ${center}
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(24, 35),
    { offset: new kakao.maps.Point(12, 35) }
  );
}
function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export default function KakaoMap({ enableGrid = true, interactive = true }: Props) {
  const setMapActions = useMapStore((s) => s.setMapActions);
  const clearMapActions = useMapStore((s) => s.clearMapActions);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const kakaoRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const infraCircleRef = useRef<any>(null);

  const setBounds = useMapStore((s) => s.setBounds);
  const bounds = useMapStore((s) => s.bounds);
  const grids = useMapStore((s) => s.grids);
  const setGrids = useMapStore((s) => s.setGrids);
  const setGridsLoading = useMapStore((s) => s.setGridsLoading);
  const gridsVisible = useMapStore((s) => s.gridsVisible);
  const visibleGrades = useMapStore((s) => s.visibleGrades);
  //events
  const cityEventMarkersRef = useRef<any[]>([]);
  const setCityEvents = useMapStore((s) => s.setCityEvents);
  const setCityEventsLoading = useMapStore((s) => s.setCityEventsLoading);
  const selectedGridId = useMapStore((s) => s.selectedGridId);
  const setSelectedGridId = useMapStore((s) => s.setSelectedGridId);
  const infraVisible = useMapStore((s) => s.infraVisible);
  const visibleInfraTypes = useMapStore((s) => s.visibleInfraTypes);
  const setInfrastructures = useMapStore((s) => s.setInfrastructures);

  const setGridDetail = useMapStore((s) => s.setGridDetail);
  const setDetailLoading = useMapStore((s) => s.setDetailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);

  //reports
  const reportMarkersRef = useRef<any[]>([]);
  const setReports = useMapStore((s) => s.setReports);
  const setReportsLoading = useMapStore((s) => s.setReportsLoading);

  // 내위치 — 지도에 표시할 사용자 위치 마커 보관
  const myLocationMarkerRef = useRef<any>(null);

  // 내위치 — 파란 핀 생성/이동
  const updateMyLocationMarker = (lat: number, lng: number) => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;
    if (!map || !kakao) return;
    const position = new kakao.maps.LatLng(lat, lng);
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setPosition(position);
      return;
    }
    myLocationMarkerRef.current = new kakao.maps.Marker({
      map,
      position,
      title: "내 위치",
      image: createPinImage(kakao, MARKER_COLORS.me), // 내위치 — 파란
    });
  };

  //admin
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const focusMarkerRef = useRef<any>(null);

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
        updateMyLocationMarker(coords.latitude, coords.longitude); // 내위치 — 파란 핀
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

  const searchAddress = (q: string) => {
    const kakao = kakaoRef.current;
    if (!kakao || !q.trim()) return;

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(q.trim(), (result: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        clearSelection();
        moveMap(Number(result[0].y), Number(result[0].x), 5);
        return;
      }

      const places = new kakao.maps.services.Places();
      places.keywordSearch(q.trim(), (data: any[], status2: string) => {
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

        //관리자 페이지에서 드래그/줌 불가 설정
        map.setDraggable(interactive);
        map.setZoomable(interactive);

        setMapActions({
          moveTo: (lat, lng, level = 6) => {
            clearSelection();
            moveMap(lat, lng, level);
          },
          searchAddress,
          moveToCurrentLocation,
        });

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
              updateMyLocationMarker(coords.latitude, coords.longitude); // 내위치 — 최초 파란 핀
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
      clearMapActions();
    };
  }, [setBounds, setMapActions, clearMapActions, clearSelection]);

  // 2) 격자 데이터 조회 (bounds 변경 시)
  useEffect(() => {
    if (!enableGrid) return;
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
        const next = await get<GridItem[]>(`/grids?${params}`);
        if (cancelled) return;
        setGrids(next);
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

  // 2b) 격자 Polygon 그리기 (표시 on/off · 등급 필터)
  useEffect(() => {
    if (!mapRef.current || !kakaoRef.current) return;

    const kakao = kakaoRef.current;
    const map = mapRef.current;

    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    if (!gridsVisible) return;

    const gradeSet = new Set(visibleGrades);

    grids.forEach((g) => {
      if (g.lat == null || g.lng == null) return;
      // 등급 없는 격자는 미표시 / 꺼진 등급은 스킵
      if (!isSafetyGrade(g.safety_grade) || !gradeSet.has(g.safety_grade)) {
        return;
      }

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
        const store = useMapStore.getState();
        const current = store.selectedGridId;
        if (current === g.grid_id) {
          clearSelection();
        } else {
          setSelectedGridId(g.grid_id);
          store.setSidePanelTab("grid");
          store.setSidePanelOpen(true);
        }
      });

      polygonsRef.current.push(polygon);
    });
  }, [
    grids,
    gridsVisible,
    visibleGrades,
    setSelectedGridId,
    clearSelection,
  ]);

  //2.5) 뷰포인트 이벤트
  useEffect(() => {
    if (!bounds || !mapRef.current || !kakaoRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        setCityEventsLoading(true);

        const center = mapRef.current.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        const dLat = CENTER_EVENT_RADIUS_KM / 111.32;
        const dLng =
          CENTER_EVENT_RADIUS_KM /
          (111.32 * Math.cos((lat * Math.PI) / 180));
        const params = new URLSearchParams({
          sw_lat: String(lat - dLat),
          sw_lng: String(lng - dLng),
          ne_lat: String(lat + dLat),
          ne_lng: String(lng + dLng),
        });

        const events = await get<CityEventItem[]>(`/city-events?${params}`);
        if (cancelled) return;

        const nearby = events.filter(
          (e) =>
            e.lat != null &&
            e.lng != null &&
            distKm(lat, lng, e.lat, e.lng) <= CENTER_EVENT_RADIUS_KM
        );
        setCityEvents(nearby);
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        cityEventMarkersRef.current.forEach((m) => m.setMap(null));
        cityEventMarkersRef.current = [];
        nearby.forEach((e) => {
          if (e.lat == null || e.lng == null) return;
          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(e.lat, e.lng),
            title: e.title ?? e.type ?? "도시정보",
            image: createPinImage(kakao, MARKER_COLORS.event), // 행사 - 분홍색
          });
          // InfoWindow 없음 — 왼쪽 패널에서 행사 정보 표시
          kakao.maps.event.addListener(marker, "click", () => {
            const store = useMapStore.getState();
            store.setSelectedEventId(e.id);
            store.setSidePanelTab("events");
            store.setSidePanelOpen(true);
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
        const center = mapRef.current.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        const dLat = CENTER_EVENT_RADIUS_KM / 111.32;
        const dLng =
          CENTER_EVENT_RADIUS_KM /
          (111.32 * Math.cos((lat * Math.PI) / 180));
        const params = new URLSearchParams({
          sw_lat: String(lat - dLat),
          sw_lng: String(lng - dLng),
          ne_lat: String(lat + dLat),
          ne_lng: String(lng + dLng),
        });
        const reports = await get<ReportItem[]>(`/reports?${params}`);
        if (cancelled) return;

        const nearby = reports.filter(
          (r) =>
            r.lat != null &&
            r.lng != null &&
            distKm(lat, lng, r.lat, r.lng) <= CENTER_EVENT_RADIUS_KM
        );
        setReports(nearby);
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        reportMarkersRef.current.forEach((m) => m.setMap(null));
        reportMarkersRef.current = [];

        nearby.forEach((r) => {
          if (r.lat == null || r.lng == null) return;

          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(r.lat, r.lng),
            title: r.type ?? "제보",
            image: createPinImage(kakao, MARKER_COLORS.report), // report — 붉은색
          });

          kakao.maps.event.addListener(marker, "click", () => {
            const store = useMapStore.getState();
            store.setSelectedReportId(r.id);
            store.setSidePanelTab("reports");
            store.setSidePanelOpen(true);
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

  // 3) 지도 중심+반경 → 인프라 마커 (격자 비종속)
  useEffect(() => {
    const clearInfra = () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (infraCircleRef.current) {
        infraCircleRef.current.setMap(null);
        infraCircleRef.current = null;
      }
    };

    if (!bounds || !mapRef.current || !kakaoRef.current) {
      clearInfra();
      return;
    }

    // 전체 OFF → API 없이 마커·원 전부 제거
    if (!infraVisible) {
      clearInfra();
      setInfrastructures([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        const center = map.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();
        const level = map.getLevel();
        const radius_m = levelToRadiusM(level);

        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radius_m: String(radius_m),
        });

        const items = await get<InfrastructureItem[]>(
          `/infrastructures?${params}`
        );
        if (cancelled) return;

        const typeSet = new Set(visibleInfraTypes);
        const filtered = items.filter(
          (item) => item.type != null && typeSet.has(item.type as InfraType)
        );

        setInfrastructures(filtered);

        clearInfra();

        filtered.forEach((item) => {
          if (item.lat == null || item.lng == null) return;

          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(item.lat, item.lng),
            title: `${item.type ?? ""} ${item.address ?? ""}`.trim(),
            image: createPinImage(
              kakao,
              infraColor(item.type),
              infraLabel(item.type)
            ),
          });
          markersRef.current.push(marker);
        });

        // DEBUG: 조회 반경 원
        if (DEBUG_INFRA_RANGE_CIRCLE) {
          infraCircleRef.current = new kakao.maps.Circle({
            map,
            center: new kakao.maps.LatLng(lat, lng),
            radius: radius_m,
            strokeWeight: 2,
            strokeColor: "#16a34a",
            strokeOpacity: 0.7,
            strokeStyle: "dashed",
            fillColor: "#16a34a",
            fillOpacity: 0,
          });
        }
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bounds, infraVisible, visibleInfraTypes, setInfrastructures]);

  // 4) 선택 격자 → 인포카드 detail (인프라 마커와 분리)
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

  // interactive 변경 시 드래그/줌 on/off
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setDraggable(interactive);
    map.setZoomable(interactive);
  }, [interactive]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;

}