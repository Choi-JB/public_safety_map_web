// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import styles from "../admin.module.css";

function WarningIcon() {
  return (
    <div className={styles.confirmIcon} aria-hidden>
      <span className={styles.confirmIconMark}>!</span>
    </div>
  );
}

export function DeleteConfirmModal() {
  const deleteTarget = useAdminStore((s) => s.deleteTarget);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const confirmDelete = useAdminStore((s) => s.confirmDelete);
  const loading = useAdminStore((s) => s.loading);
  const tab = useAdminStore((s) => s.tab);

  if (!deleteTarget) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.confirmModal}>
        <WarningIcon />
        <h2 className={styles.confirmTitle}>해당 내용이 지도에서 비활성화됩니다.</h2>
        <p className={styles.confirmDesc}>
          {tab === "reports" ? (
            <span>
              (제보는 등록 24시간 후 자동 비활성화되며<br />
              7일 후 DB에서 자동 삭제됩니다.)
            </span>
          ) : (
            <span>
              
            </span>
          )}
        </p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={() => openDeleteConfirm(null)}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={() => void confirmDelete()}
            disabled={loading}
          >
            {loading ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
