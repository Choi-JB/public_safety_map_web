"use client";

import { useEffect, useRef } from "react";
import { get } from "@/lib/api/client";
import type {
  CityEventItem,
  GridDetail,
  GridItem,
  InfrastructureItem,
  ReportItem,
} from "@/lib/api/types";
import { loadKakaoMap } from "./loadkakaoMap";
import { gridRectanglePath, safetyGradeColor } from "./gridStyle";
import { useMapStore } from "@/store/mapStore";

const MAX_ZOOM_OUT = 7;
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export default function KakaoMap() {
  const setMapActions = useMapStore((s) => s.setMapActions);
  const clearMapActions = useMapStore((s) => s.clearMapActions);

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
  const setInfrastructures = useMapStore((s) => s.setInfrastructures);

  const setGridDetail = useMapStore((s) => s.setGridDetail);
  const setDetailLoading = useMapStore((s) => s.setDetailLoading);
  const clearSelection = useMapStore((s) => s.clearSelection);

  //reports
  const reportMarkersRef = useRef<any[]>([]);
  const activeReportIwRef = useRef<{ id: number; iw: any } | null>(null);
  const setReports = useMapStore((s) => s.setReports);
  const setReportsLoading = useMapStore((s) => s.setReportsLoading);

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
}, [bounds,setGridsLoading, setCityEvents, setCityEventsLoading]);

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

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}