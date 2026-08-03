// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import { AdminMapPanel } from "./layout/AdminMapPanel";
import { AdminTopbar } from "./layout/AdminTopbar";
import { CityEventModal } from "./modals/CityEventModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { ImagePreviewModal } from "./modals/ImagePreviewModal";
import { RestoreConfirmModal } from "./modals/RestoreConfirmModal";
import { CityEventsPanel } from "./panels/CityEventsPanel";
import { DashboardPanel } from "./panels/DashboardPanel";
import { FeedbacksPanel } from "./panels/FeedbacksPanel";
import { MarkersPanel } from "./panels/markers/MarkersPanel";
import { ReportsPanel } from "./panels/ReportsPanel";
import { SettingPanel } from "./panels/SettingPanel";
import styles from "./admin.module.css";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

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
    case "settings":
      return <SettingPanel />;
    default:
      return null;
  }
}

export function AdminShell() {
  const error = useAdminStore((s) => s.error);
  const message = useAdminStore((s) => s.message);
  const clearNotice = useAdminStore((s) => s.clearNotice);
  const router = useRouter();

  useEffect(() => {
    return () => {
      useAdminStore.setState({ mapFocus: null });
    };
  }, []);

  useEffect(() => {
    if (!error) return;
  
    const isSessionError =
      error.includes("세션") ||
      error.includes("만료") ||
      error.includes("다른"); // 백엔드 문구에 맞게 조정
  
    if (!isSessionError) return;
  
    alert(error);
    clearNotice();
    // auth 상태 정리
    useAuthStore.setState({
      user: null,
      authType: null,
      sessionId: null,
      accessToken: null,
    });
    router.push("/login");
  }, [error, clearNotice, router]);

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
      <RestoreConfirmModal />
  
    </div>
  );
}
