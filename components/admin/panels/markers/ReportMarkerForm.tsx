// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import styles from "../../admin.module.css";
import { ImageAttachField } from "../../shared/ImageAttachField";
import { useAdminStore } from "@/store/adminStore";
import { useMapStore } from "@/store/mapStore";

const REPORT_TYPE_OPTIONS = ["사고", "공사", "자연재해", "통제", "기타"] as const;

export function ReportMarkerForm() {
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const searchAddress = useMapStore((s) => s.searchAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [gridId, setGridId] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    if (!mapFocus) return;
    setGridId(mapFocus.grid_id ? String(mapFocus.grid_id) : "none");
    setLat(String(mapFocus.lat));
    setLng(String(mapFocus.lng));
  }, [mapFocus]);

  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => e.preventDefault()}
      aria-label="제보 마커 등록"
    >
      <div className={`${styles.markerSearchRow} ${styles.full}`}>
        <label htmlFor="marker-report-address-search">주소 또는 장소 검색</label>
        <div className={styles.markerSearchInputRow}>
          <input
            id="marker-report-address-search"
            type="search"
            placeholder="주소 또는 장소 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              searchAddress?.(searchQuery);
            }}
          />
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => searchAddress?.(searchQuery)}
          >
            검색
          </button>
        </div>
      </div>

      <div className={`${styles.coordRow} ${styles.full}`}>
        <div className={`${styles.field} ${styles.gridIdField}`}>
          <label htmlFor="marker-report-grid-id">그리드 ID</label>
          <input
            id="marker-report-grid-id"
            placeholder="000000"
            value={gridId}
            readOnly
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="marker-report-lat">위도</label>
          <input
            id="marker-report-lat"
            placeholder="37.5665"
            value={lat}
            onChange={(e) => {
              const nextLat = e.target.value;
              setLat(nextLat);
              setMapFocus({
                lat: Number(nextLat),
                lng: Number(lng),
                description: "마커 위치",
              });
            }}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="marker-report-lng">경도</label>
          <input
            id="marker-report-lng"
            placeholder="126.9780"
            value={lng}
            onChange={(e) => {
              const nextLng = e.target.value;
              setLng(nextLng);
              setMapFocus({
                lat: Number(lat),
                lng: Number(nextLng),
                description: "마커 위치",
              });
            }}
          />
        </div>
      </div>

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
