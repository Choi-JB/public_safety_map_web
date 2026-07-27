// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import styles from "../admin.module.css";

export function DeleteConfirmModal() {
  const deleteTarget = useAdminStore((s) => s.deleteTarget);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const confirmDelete = useAdminStore((s) => s.confirmDelete);
  const loading = useAdminStore((s) => s.loading);

  if (!deleteTarget) return null;

  const isHardDelete = deleteTarget.kind === "event";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalTitle}>삭제 확인</div>
        <div className={styles.modalBody}>
          <p>
            <strong>{deleteTarget.label}</strong> 항목을 삭제할까요?
          </p>
          {isHardDelete ? (
            <p className={styles.hint}>도시정보는 목록에서 완전히 삭제됩니다.</p>
          ) : (
            <p className={styles.hint}>
              소프트 삭제 — 목록에서 비활성 처리됩니다.
            </p>
          )}
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => openDeleteConfirm(null)}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={() => void confirmDelete()}
            disabled={loading}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
