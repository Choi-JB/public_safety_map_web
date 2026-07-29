// 담당: 피드백/관리자팀

"use client";

import { useRef, useState, type ChangeEvent } from "react";
import styles from "../../admin.module.css";

type Props = {
  inputId: string;
};

export function ImageAttachField({ inputId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className={`${styles.field} ${styles.full}`}>
      <span className={styles.fieldLabel}>이미지</span>
      <div className={styles.imageAttachRow}>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleImageChange}
        />
        <label htmlFor={inputId} className={styles.button}>
          이미지 첨부
        </label>
        {imagePreview ? (
          <div className={styles.imagePreviewBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="첨부 미리보기" />
            <button
              type="button"
              className={styles.imagePreviewClear}
              onClick={clearImage}
              aria-label="첨부 이미지 제거"
            >
              ×
            </button>
          </div>
        ) : (
          <div className={styles.imagePreviewEmpty}>미리보기 없음</div>
        )}
      </div>
    </div>
  );
}
