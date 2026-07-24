// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import { AdminMapPanel } from "./AdminMapPanel";
import { AdminTopbar } from "./AdminTopbar";
import { CityEventsPanel } from "./CityEventsPanel";
import { DashboardPanel } from "./DashboardPanel";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { CityEventModal } from "./CityEventModal";
import { FeedbacksPanel } from "./FeedbacksPanel";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { MarkersPanel } from "./MarkersPanel";
import { ReportsPanel } from "./ReportsPanel";
import styles from "./admin.module.css";

function PanelContent() {
  const tab = useAdminStore((s) => s.tab);

  switch (tab) {
    case "dashboard":
      return <DashboardPanel />;
    case "reports":
      return <ReportsPanel />;
    case "feedbacks":
      return <FeedbacksPanel />;
    case "markers":
      return <MarkersPanel />;
    case "city-events":
      return <CityEventsPanel />;
    default:
      return null;
  }
}

export function AdminShell() {
  const error = useAdminStore((s) => s.error);
  const message = useAdminStore((s) => s.message);
  const clearNotice = useAdminStore((s) => s.clearNotice);

  return (
    <div className={styles.shell}>
      <AdminTopbar />
      <div className={styles.body}>
        <AdminMapPanel />
        <section className={styles.panelCard} aria-label="관리자 패널">
          {(error || message) && (
            <div style={{ padding: "12px 16px 0" }}>
              {error && (
                <div className={`${styles.notice} ${styles.noticeError}`}>
                  {error}
                  <button
                    type="button"
                    className={styles.button}
                    style={{ marginLeft: 8 }}
                    onClick={clearNotice}
                  >
                    닫기
                  </button>
                </div>
              )}
              {message && (
                <div className={`${styles.notice} ${styles.noticeOk}`}>
                  {message}
                  <button
                    type="button"
                    className={styles.button}
                    style={{ marginLeft: 8 }}
                    onClick={clearNotice}
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}
          <PanelContent />
        </section>
      </div>

      <ImagePreviewModal />
      <CityEventModal />
      <DeleteConfirmModal />
    </div>
  );
}
