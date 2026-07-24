// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import styles from "./admin.module.css";

export function AdminMapPanel() {
  const mapFocus = useAdminStore((s) => s.mapFocus);

  return (
    <section className={styles.mapCard} aria-label="관리자 지도 영역">
      <div className={styles.mapHeader}>지도</div>
      <div className={styles.mapBody}>
        {mapFocus ? (
          <>
            <div className={styles.mapPin} aria-hidden />
            <div className={styles.mapFocusLabel}>
              {mapFocus.label ?? "선택 위치"}
            </div>
            <div>
              lat {mapFocus.lat.toFixed(5)}, lng {mapFocus.lng.toFixed(5)}
            </div>
            {mapFocus.kind === "report" && (
              <div className={styles.mapFocusBadge}>선택됨 · 제보 #{mapFocus.id}</div>
            )}
            {mapFocus.kind === "feedback" && (
              <div className={styles.mapFocusBadge}>
                선택됨 · 피드백 #{mapFocus.id}
              </div>
            )}
            {mapFocus.kind === "event" && (
              <div className={styles.mapFocusBadge}>
                선택됨 · 도시정보 #{mapFocus.id}
              </div>
            )}
            <p className={styles.hint}>
              지도표시팀 지도 연동 전 — 좌표 포커스 미리보기
            </p>
          </>
        ) : (
          <>
            <div className={styles.mapPin} aria-hidden />
            <div>좌측 지도 영역 (40%)</div>
            <p className={styles.hint}>
              테이블의 지도이동을 누르면 해당 좌표가 여기에 표시됩니다.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
