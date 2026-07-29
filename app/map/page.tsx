"use client";

import KakaoMap from "./kakaoMap";
import { AuthEntry } from "@/components/login/AuthEntry";
import MapControls from "./MapControls";
import CityEventsPanel from "./CityEventsPanel";

// 담당: 지도표시팀
// GridInfoCard → CityEventsPanel 격자 탭으로 통합

export default function MapPage() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <AuthEntry />
      <CityEventsPanel />
      <KakaoMap />
      <MapControls />
    </div>
  );
}
