// 담당: 피드백/관리자팀

"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import { BackIcon } from "../shared/BackIcon";
import styles from "../admin.module.css";
import KakaoMap from "@/app/map/kakaoMap";


export function AdminMapPanel() {
  const router = useRouter();

  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const tab = useAdminStore((s) => s.tab);
  // 제보·도시정보(원하면 피드백도)에서는 지도 조작 잠금
  // 마커 등록 탭은 좌표 선택이 필요할 수 있어 열어 둠
  const interactive = !(
    tab === "reports" ||
    tab === "city-events" ||
    tab === "feedbacks"
  ); //지도 조작 잠금할 페이지 목록
  
  const backToMap = () => {
    setMapFocus(null);
    router.push("/map");
  };

  return (
    <section className={styles.mapCard} aria-label="관리자 지도 영역">
      <div className={styles.mapHeader}>
        <button
          type="button"
          className={styles.mapBackButton}
          onClick={backToMap}
        >
          <BackIcon size={18} />
          <span>지도 화면으로 돌아가기</span>
        </button>
      </div>
      <div className={styles.mapBody}>
        <KakaoMap enableGrid={false} interactive={interactive} />

      </div>
    </section>
  );
}
