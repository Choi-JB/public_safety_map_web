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

  if (!deleteTarget) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.confirmModal}>
        <WarningIcon />
        <h2 className={styles.confirmTitle}>해당 내용을 삭제하시겠습니까?</h2>
        <p className={styles.confirmDesc}>
          해당 항목은 비활성화 처리 후 30일 후에 삭제됩니다.
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
