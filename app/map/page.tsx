"use client";

import KakaoMap from "./kakaoMap";
import { AuthEntry } from "@/components/login/AuthEntry";
import MapControls from "./MapControls";
import CityEventsPanel from "./CityEventsPanel";
import { ChatFab } from "@/components/chat/ChatFab";
import { useAuthStore } from "@/store/authStore";


export default function MapPage() {
  const selectedPlaceId = "room1";
  const authType = useAuthStore((s) => s.authType);
  const role = useAuthStore((s) => s.user?.role);
  const isUser = role === "USER";

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
      {isUser && <ChatFab />}
    </div>
  );
}