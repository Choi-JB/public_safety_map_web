// 담당: 피드백/관리자팀

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "../admin.module.css";

type Props = {
  inputId: string;
  disabled?: boolean;
  /** 서버에 이미 저장된 이미지 URL */
  existingUrl?: string | null;
  onPreviewClick?: (url: string) => void;
  onFileChange?: (file: File | null) => void;
};

export function ImageAttachField({
  inputId,
  disabled = false,
  existingUrl = null,
  onPreviewClick,
  onFileChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    setLocalPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [existingUrl]);

  const displayUrl = localPreview || existingUrl || null;

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setLocalPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      onFileChange?.(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    onFileChange?.(file);
  }

  function clearImage() {
    setLocalPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    onFileChange?.(null);
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
          disabled={disabled}
          onChange={handleImageChange}
        />
        {!disabled && (
          <label htmlFor={inputId} className={styles.button}>
            이미지 첨부
          </label>
        )}
        {displayUrl ? (
          <div className={styles.imagePreviewBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="첨부 미리보기"
              role={onPreviewClick ? "button" : undefined}
              style={onPreviewClick ? { cursor: "pointer" } : undefined}
              onClick={() => onPreviewClick?.(displayUrl)}
            />
            {!disabled && (
              <button
                type="button"
                className={styles.imagePreviewClear}
                onClick={clearImage}
                aria-label="첨부 이미지 제거"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className={styles.imagePreviewEmpty}>미리보기 없음</div>
        )}
      </div>
    </div>
  );
}
