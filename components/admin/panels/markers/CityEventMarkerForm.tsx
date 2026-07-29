// 담당: 피드백/관리자팀

"use client";

import styles from "../../admin.module.css";
import { ImageAttachField } from "./ImageAttachField";

const CITY_TYPE_OPTIONS = ["행사", "인파 밀집", "교통 통제", "기타"] as const;

export function CityEventMarkerForm() {
  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => e.preventDefault()}
      aria-label="도시정보 마커 등록"
    >
      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-type">유형</label>
        <select id="marker-city-type" defaultValue="">
          <option value="" disabled>
            유형 선택
          </option>
          {CITY_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-title">제목</label>
        <input
          id="marker-city-title"
          placeholder="도시정보 제목을 입력하세요"
        />
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-desc">설명</label>
        <textarea
          id="marker-city-desc"
          rows={4}
          placeholder="도시정보 내용을 입력하세요"
        />
      </div>

      <ImageAttachField inputId="marker-city-image" />

      <div className={`${styles.coordRow} ${styles.full}`}>
        <div className={styles.field}>
          <label htmlFor="marker-city-lat">위도</label>
          <input id="marker-city-lat" placeholder="37.5665" />
        </div>
        <div className={styles.field}>
          <label htmlFor="marker-city-lng">경도</label>
          <input id="marker-city-lng" placeholder="126.9780" />
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
