// 담당: 피드백/관리자팀

"use client";

import { useAdminStore } from "@/store/adminStore";
import styles from "../admin.module.css";

export function ImagePreviewModal() {
  const previewImageUrl = useAdminStore((s) => s.previewImageUrl);
  const openImagePreview = useAdminStore((s) => s.openImagePreview);

  if (!previewImageUrl) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="제보 사진"
      onClick={() => openImagePreview(null)}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>첨부 사진</div>
        <div className={styles.modalBody}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt="제보 첨부 사진"
            className={styles.previewImage}
          />
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => openImagePreview(null)}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
