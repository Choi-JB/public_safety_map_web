// 담당: 피드백/관리자팀

"use client";

import styles from "../../admin.module.css";
import { ImageAttachField } from "./ImageAttachField";

const REPORT_TYPE_OPTIONS = ["사고", "공사", "자연재해", "통제", "기타"] as const;

export function ReportMarkerForm() {
  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => e.preventDefault()}
      aria-label="제보 마커 등록"
    >
      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-report-type">유형</label>
        <select id="marker-report-type" defaultValue="">
          <option value="" disabled>
            유형 선택
          </option>
          {REPORT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-report-desc">설명</label>
        <textarea
          id="marker-report-desc"
          rows={4}
          placeholder="제보 내용을 입력하세요"
        />
      </div>

      <ImageAttachField inputId="marker-report-image" />

      <div className={`${styles.coordRow} ${styles.full}`}>
        <div className={styles.field}>
          <label htmlFor="marker-report-lat">위도</label>
          <input id="marker-report-lat" placeholder="37.5665" />
        </div>
        <div className={styles.field}>
          <label htmlFor="marker-report-lng">경도</label>
          <input id="marker-report-lng" placeholder="126.9780" />
        </div>
        <button type="button" className={styles.button}>
          지도에서 좌표 가져오기
        </button>
      </div>

      <div className={`${styles.formActions} ${styles.full}`}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled
        >
          등록
        </button>
        <button type="button" className={styles.button} disabled>
          초기화
        </button>
      </div>
    </form>
  );
}
