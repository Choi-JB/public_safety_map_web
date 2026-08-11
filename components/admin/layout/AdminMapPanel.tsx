// 담당: 피드백/관리자팀

"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import { BackIcon } from "../shared/BackIcon";
import styles from "../admin.module.css";


import AdminMap from "../shared/AdminMap";

export function AdminMapPanel() {
  const router = useRouter();

  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const tab = useAdminStore((s) => s.tab);

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
      {/* 관리자 페이지에서 지도 조작 불가능 하도록 (pointerEvents 변경 시 드래그/줌 on/off) */}
      <div  
        className={styles.mapBody} 
        style={{ pointerEvents: tab === "markers" ? "auto" : "none" }}
      >
        <AdminMap />

      </div>
    </section>
  );
}
