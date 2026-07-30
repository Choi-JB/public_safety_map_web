// 담당: 피드백/관리자팀
// 작성자: 최정봉
// 내용: 이미지 첨부 필드
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "../admin.module.css";
import { resizeImage } from "@/lib/utils/imageResize";

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

  /** 컴포넌트가 사라질 때 이미지 미리보기 URL 해제 */
  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const displayUrl = localPreview || existingUrl || null;

  /** 이미지 파일 변경 이벤트 핸들러 */
  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0] ?? null;

    if (!originalFile) {
      clearImage();
      return;
    }

    if (!originalFile.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }

    try {
      const resizedFile = await resizeImage(originalFile, 800, 0.7);
      const previewUrl = URL.createObjectURL(resizedFile);
      setLocalPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
      onFileChange?.(resizedFile);
    } catch (error) {
      console.error(error);
      alert("이미지 처리에 실패했습니다.");
      e.target.value = "";
      onFileChange?.(null);
    }
  }

  /** 이미지 제거 핸들러 */
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
