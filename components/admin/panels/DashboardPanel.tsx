// 담당: 피드백/관리자팀

"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import { DailyTrendChart } from "../shared/DailyTrendChart";
import { EventIcon } from "../shared/EventIcon";
import { FeedbackIcon } from "../shared/FeedbackIcon";
import { formatCreatedAt } from "../shared/formatDate";
import { ReportIcon } from "../shared/ReportIcon";
import { Skeleton, SkeletonTableRows } from "../shared/Skeleton";
import styles from "../admin.module.css";

type RecentItem = {
  kind: "report" | "feedback";
  id: string;
  label: string;
  nickname: string;
  created_at: string;
};

export function DashboardPanel() {
  const summary = useAdminStore((s) => s.summary);
  const loading = useAdminStore((s) => s.loading);
  const loadSummary = useAdminStore((s) => s.loadSummary);
  const recentReports = useAdminStore((s) => s.recentReports);
  const recentFeedbacks = useAdminStore((s) => s.recentFeedbacks);
  const loadRecentActivity = useAdminStore((s) => s.loadRecentActivity);

  useEffect(() => {
    void loadSummary();
    void loadRecentActivity();
  }, [loadSummary, loadRecentActivity]);

  const recentItems: RecentItem[] = [
    ...recentReports.map((r) => ({
      kind: "report" as const,
      id: r.id,
      label: `[${r.type}] ${r.description}`,
      nickname: r.user?.nickname?.trim() || "-",
      created_at: r.created_at,
    })),
    ...recentFeedbacks.map((f) => ({
      kind: "feedback" as const,
      id: f.id,
      label: f.comment || "-",
      nickname: f.user?.nickname?.trim() || "-",
      created_at: f.created_at,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const cards = [
    {
      label: "활성 제보",
      value: summary?.active_reports ?? "-",
      today: summary?.reports_today,
      icon: <ReportIcon size={18} />,
      iconClass: styles.statIconBlue,
    },
    {
      label: "누적 피드백",
      value: summary?.total_feedbacks ?? "-",
      today: summary?.feedbacks_today,
      icon: <FeedbackIcon size={18} />,
      iconClass: styles.statIconGreen,
    },
    {
      label: "진행 중이거나 예정된 도시정보",
      value: summary?.active_city_events ?? "-",
      ended: summary?.inactive_city_events ?? "-",
      icon: <EventIcon size={18} />,
      iconClass: styles.statIconAmber,
    },
  ];

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelHeader}>대시보드</div>
      <div className={styles.panelBodyScroll}>
        <div className={styles.cards}>
          {loading && !summary
            ? Array.from({ length: 3 }).map((_, i) => (
                <article key={i} className={styles.statCard}>
                  <div className={styles.statCardHeader}>
                    <Skeleton height={13} width="50%" />
                    <Skeleton height={36} width={36} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Skeleton height={32} width="70%" />
                  </div>
                </article>
              ))
            : cards.map((card) => (
                <article key={card.label} className={styles.statCard}>
                  <div className={styles.statCardHeader}>
                    <div className={styles.statLabel}>{card.label}</div>
                    <span
                      className={`${styles.statIconBadge} ${card.iconClass}`}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <div className={styles.statValue}>{card.value}</div>
                  {typeof card.today === "number" && (
                    <div className={styles.statToday}>오늘 +{card.today}</div>
                  ) || (typeof card.ended === "number" && (
                    <div className={styles.statToday}>종료 +{card.ended}</div>
                  ))}
                </article>
              ))}
        </div>

        {summary && 
         Array.isArray(summary.five_days_reports_count) &&
         summary.five_days_reports_count.length > 0 && (
          <>
            <div className={styles.panelHeader} style={{ marginTop: 16 }}>
              [최근 5일] 신규 제보 / 피드백 추이
            </div>
            <div className={styles.statCard}>
              <DailyTrendChart
                reportsDaily={summary.five_days_reports_count}
                feedbacksDaily={summary.five_days_feedbacks_count}
              />
            </div>
          </>
        )}

        <div className={styles.panelHeader} style={{ marginTop: 16 }}>
          최근 활동
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>구분</th>
                <th>내용</th>
                <th>작성자</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading && recentItems.length === 0 ? (
                <SkeletonTableRows rows={5} columns={4} />
              ) : recentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    최근 활동이 없습니다.
                  </td>
                </tr>
              ) : (
                recentItems.map((item) => (
                  <tr key={`${item.kind}-${item.id}`}>
                    <td>{item.kind === "report" ? "제보" : "피드백"}</td>
                    <td>{item.label}</td>
                    <td>{item.nickname}</td>
                    <td className={styles.dateCell}>
                      {formatCreatedAt(item.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
