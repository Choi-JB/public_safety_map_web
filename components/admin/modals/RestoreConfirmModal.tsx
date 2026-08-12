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

export function RestoreConfirmModal() {
  const restoreTarget = useAdminStore((s) => s.restoreTarget);
  const openRestoreConfirm = useAdminStore((s) => s.openRestoreConfirm);
  const confirmRestore = useAdminStore((s) => s.confirmRestore);
  const loading = useAdminStore((s) => s.loading);

  if (!restoreTarget) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.confirmModal}>
        <WarningIcon />
        <h2 className={styles.confirmTitle}>해당 내용을 복구하시겠습니까?</h2>
        <p className={styles.confirmDesc}>
          비활성화된 항목을 다시 활성화합니다.
        </p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={() => openRestoreConfirm(null)}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.confirmRestore}
            onClick={() => void confirmRestore()}
            disabled={loading}
          >
            {loading ? "복구 중…" : "복구"}
          </button>
        </div>
      </div>
    </div>
  );
}
