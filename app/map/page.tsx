import KakaoMap from "./kakaoMap";
import { AuthEntry } from "@/components/login/AuthEntry";

// 담당: 지도표시팀

export default function MapPage() {
  return (
    <>
      <KakaoMap />;
      <AuthEntry />
    </>
  )
}
