"use client";

import KakaoMap from "./kakaoMap";
import MapControls from "./MapControls";
import GridInfoCard from "./GridInfoCard";

// 담당: 지도표시팀

export default function MapPage() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <KakaoMap />
      <MapControls />
      <GridInfoCard />
    </div>
  );
}
