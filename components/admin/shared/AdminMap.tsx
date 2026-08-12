"use client";

import { useEffect, useRef } from "react";
import { loadKakaoMap } from "@/app/map/loadkakaoMap";
import {
    MARKER_COLORS,
    createPinImage,
    createReportImage,
} from "@/app/map/markerImages";
import { useMapStore } from "@/store/mapStore";
import { useAdminStore } from "@/store/adminStore";
import { fetchGridId, type MapFocus } from "@/lib/api/admin";

const MAX_ZOOM_OUT = 7; // --> 최대 줌 아웃 레벨

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function createFocusMarkerImage(kakao: any, focus: MapFocus) {
    if (focus.kind === "event") {
        return createPinImage(kakao, MARKER_COLORS.event);
    }
    if (focus.kind === "feedback") {
        return createPinImage(kakao, "#64748b");
    }
    return createReportImage(kakao, focus.label ?? null);
}



export default function AdminMap() {
    const setMapActions = useMapStore((s) => s.setMapActions);
    const clearMapActions = useMapStore((s) => s.clearMapActions);

    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const kakaoRef = useRef<any>(null);

    const tab = useAdminStore((s) => s.tab);

    const setBounds = useMapStore((s) => s.setBounds);

    //events

    const clearSelection = useMapStore((s) => s.clearSelection);



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
        // myLocationMarkerRef.current = new kakao.maps.Marker({
        //     map,
        //     position,
        //     title: "내 위치",
        //     image: createPinImage(kakao, MARKER_COLORS.me), // 내위치 — 파란
        // });
    };

    //admin
    const mapFocus = useAdminStore((s) => s.mapFocus);
    const setMapFocus = useAdminStore((s) => s.setMapFocus);
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

                map.setDraggable(false);
                map.setZoomable(false);


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



    //관리자페이지 mapFocus 변경 시 지도 이동
    useEffect(() => {
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        if (!kakao || !map) return;

        // 이전 포커스 마커 제거
        //focusMarkerRef.current?.setMap(null);
        //focusMarkerRef.current = null;

        if (!mapFocus) return;

        moveMap(mapFocus.lat, mapFocus.lng, 3);

        var marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(mapFocus.lat, mapFocus.lng),
            title: mapFocus.description ?? mapFocus.label ?? "",
            image: createFocusMarkerImage(kakao, mapFocus),
        });
        focusMarkerRef.current = marker;
        return () => {
            focusMarkerRef.current?.setMap(null);
            focusMarkerRef.current = null;
        };
    }, [mapFocus]);

    // 관리자 페이지에서 지도 조작 불가능 하도록 (interactive 변경 시 드래그/줌 on/off)
    useEffect(() => {
        const map = mapRef.current;
        const kakao = kakaoRef.current;
        if (!map) return;
        if (tab !== "markers") {
            map.setDraggable(false);
            map.setZoomable(false);
            return;
        }

        map.setDraggable(true);
        map.setZoomable(true);

        //클릭한 위치의 grid_id, lat, lng 정보 가져오는 클릭 이벤트 등록
        if(tab === "markers") {
        kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
            if(tab !== "markers") return;
            var latlng = mouseEvent.latLng;
            fetchGridId(latlng.getLat(), latlng.getLng()).then((gridId) => {
                setMapFocus({
                    lat: latlng.getLat(),
                    lng: latlng.getLng(),
                    description: "클릭한 위치",
                    grid_id: gridId,
                    kind: "report",
                });
            });
            
        });
        } else{
            kakao.maps.event.removeListener(map, "click");
            return;
        }
        
        return () => {
            if(tab === "markers") {
                kakao.maps.event.removeListener(map, "click");
            }
        };

    }, [tab]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;

}