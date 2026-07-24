// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import styles from "./admin.module.css";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

export function ReportDetailModal() {
  const report = useAdminStore((s) => s.selectedReport);
  const openReportDetail = useAdminStore((s) => s.openReportDetail);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);

  if (!report) return null;

  const active = report.is_active === "Y";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalTitle}>제보 상세</div>
        <div className={styles.modalBody}>
          <div>유형: {report.type}</div>
          <div>작성자: user #{report.user_id}</div>
          <div>작성일: {formatDate(report.created_at)}</div>
          <div>활성여부: {active ? "활성" : "비활성"}</div>
          <div>설명: {report.description || "-"}</div>
          <div className={styles.miniMap}>
            lat {report.lat} / lng {report.lng}
          </div>
          {report.img_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.img_url} alt="제보 첨부" style={{ maxWidth: "100%" }} />
          ) : (
            <div className={styles.hint}>첨부사진 없음</div>
          )}
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setMapFocus({
                lat: Number(report.lat),
                lng: Number(report.lng),
                label: report.type,
              });
              openReportDetail(null);
            }}
          >
            지도이동
          </button>
          {active && (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger}`}
              onClick={() =>
                openDeleteConfirm({
                  kind: "report",
                  id: report.id,
                  label: `${report.type} · user #${report.user_id}`,
                })
              }
            >
              삭제
            </button>
          )}
          <button
            type="button"
            className={styles.button}
            onClick={() => openReportDetail(null)}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackDetailModal() {
  const feedback = useAdminStore((s) => s.selectedFeedback);
  const openFeedbackDetail = useAdminStore((s) => s.openFeedbackDetail);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);

  if (!feedback) return null;

  const active = feedback.is_active === "Y";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalTitle}>피드백 상세</div>
        <div className={styles.modalBody}>
          <div>작성자: user #{feedback.user_id}</div>
          <div>격자 ID: {feedback.grid_id}</div>
          <div>체감안전도: {feedback.safety_feeling}</div>
          <div>작성일: {formatDate(feedback.created_at)}</div>
          <div>한줄평: {feedback.comment || "-"}</div>
          <div className={styles.miniMap}>
            격자 #{feedback.grid_id} 중심 좌표는 지도팀 연동 후 표시
          </div>
          {feedback.img_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={feedback.img_url}
              alt="피드백 첨부"
              style={{ maxWidth: "100%" }}
            />
          ) : (
            <div className={styles.hint}>첨부사진 없음</div>
          )}
        </div>
        <div className={styles.modalActions}>
          {active && (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger}`}
              onClick={() =>
                openDeleteConfirm({
                  kind: "feedback",
                  id: feedback.id,
                  label: `user #${feedback.user_id} · ${feedback.safety_feeling}`,
                })
              }
            >
              삭제
            </button>
          )}
          <button
            type="button"
            className={styles.button}
            onClick={() => openFeedbackDetail(null)}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
