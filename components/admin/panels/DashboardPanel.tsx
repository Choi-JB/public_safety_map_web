// 담당: 피드백/관리자팀

"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import styles from "../admin.module.css";

export function DashboardPanel() {
  const summary = useAdminStore((s) => s.summary);
  const loading = useAdminStore((s) => s.loading);
  const loadSummary = useAdminStore((s) => s.loadSummary);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const cards = [
    {
      label: "활성 제보",
      value: summary?.active_reports ?? "-",
      today: summary?.reports_today,
    },
    {
      label: "누적 피드백",
      value: summary?.total_feedbacks ?? "-",
      today: summary?.feedbacks_today,
    },
    {
      label: "진행 중이거나 예정된 도시정보",
      value: summary?.active_city_events ?? "-",
      today: undefined,
    },
  ];

  return (
    <div>
      <div className={styles.panelHeader}>대시보드</div>
      <div className={styles.panelBody}>
        {loading && !summary ? (
          <div className={styles.empty}>불러오는 중…</div>
        ) : (
          <div className={styles.cards}>
            {cards.map((card) => (
              <article key={card.label} className={styles.statCard}>
                <div className={styles.statLabel}>{card.label}</div>
                <div className={styles.statValue}>{card.value}</div>
                {typeof card.today === "number" && (
                  <div className={styles.statToday}>오늘 +{card.today}</div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
