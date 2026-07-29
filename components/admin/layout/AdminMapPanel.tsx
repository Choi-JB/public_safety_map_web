// 담당: 피드백/관리자팀

"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import { BackIcon } from "../shared/BackIcon";
import styles from "../admin.module.css";
import KakaoMap from "@/app/map/kakaoMap";
import { useMapStore } from "@/store/mapStore";
import { useEffect } from "react";
import MapControls  from "@/app/map/MapControls";


export function AdminMapPanel() {
  const router = useRouter();

  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const tab = useAdminStore((s) => s.tab);
  // 제보·도시정보(원하면 피드백도)에서는 지도 조작 잠금
  // 마커 등록 탭은 좌표 선택이 필요할 수 있어 열어 둠
  const setInteractive = useMapStore((s) => s.setInteractive);
  const gridsVisible = useMapStore((s) => s.gridsVisible);
  const setGridsVisible = useMapStore((s) => s.setGridsVisible);
  const infraVisible = useMapStore((s) => s.infraVisible);
  const setInfraVisible = useMapStore((s) => s.setInfraVisible);


  /** 관리자 페이지에서 지도 조작 불가능 하도록 (interactive 변경 시 드래그/줌 on/off) */
  useEffect(() => {
    setInteractive(!(
    tab === "reports" ||
      tab === "city-events" ||
      tab === "feedbacks" ||
      tab === "dashboard" 
    ));
    setGridsVisible(!(
      tab === "reports" ||
        tab === "city-events" ||
        tab === "feedbacks" ||
        tab === "dashboard" 
      ));
    setInfraVisible(!(
      tab === "reports" ||
        tab === "city-events" ||
        tab === "feedbacks" ||
        tab === "dashboard" 
      ));
    return () => {
      setInteractive(true);
      setGridsVisible(true);
      setInfraVisible(true);
    };
  }, [tab]);
  
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
        <KakaoMap adminMode={true} />
        {tab === "markers" && <MapControls adminMode/>}

      </div>
    </section>
  );
}
