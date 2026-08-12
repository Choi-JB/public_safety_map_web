"use client";

import KakaoMap from "./kakaoMap";
import { AuthEntry } from "@/components/login/AuthEntry";
import MapControls from "./MapControls";
import CityEventsPanel from "./CityEventsPanel";
import { ChatFab } from "@/components/chat/ChatFab";

export default function MapPage() {
  const selectedPlaceId = "room1";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <AuthEntry />
      <CityEventsPanel />
      <KakaoMap />
      <MapControls />
      <ChatFab />
    </div>
  );
}