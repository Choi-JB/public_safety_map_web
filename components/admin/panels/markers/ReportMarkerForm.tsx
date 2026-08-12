// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "../../admin.module.css";
import { ImageAttachField } from "../../shared/ImageAttachField";
import { useAdminStore } from "@/store/adminStore";
import { useMapStore } from "@/store/mapStore";
import { useAuthStore } from "@/store/authStore";
//추가 본
import { uploadReportImage } from "@/lib/api/upload";

const REPORT_TYPE_OPTIONS = ["사고","교통사고", "공사", "자연재해", "통제", "기타"] as const;

export function ReportMarkerForm() {
  const submitReport = useAdminStore((s) => s.submitReport);
  const loading = useAdminStore((s) => s.loading);
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const searchAddress = useMapStore((s) => s.searchAddress);
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [gridId, setGridId] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  //지도에 클릭한 지점의 그리드 ID, 위도, 경도 설정
  useEffect(() => {
    if (!mapFocus) return;
    setGridId(mapFocus.grid_id ? String(mapFocus.grid_id) : "none");
    setLat(String(mapFocus.lat));
    setLng(String(mapFocus.lng));
  }, [mapFocus]);

  function resetForm() {
    setGridId("");
    setLat("");
    setLng("");
    setType("");
    setDescription("");
    setImageFile(null);
    setImageKey((key) => key + 1);
    setLocalError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!type || !description.trim() || !gridId || !lat || !lng) {
      setLocalError("그리드 ID, 위경도, 유형, 설명을 모두 입력해 주세요.");
      return;
    }

    const numericGridId = Number(gridId);
    const numericLat = Number(lat);
    const numericLng = Number(lng);
    if (
      !Number.isFinite(numericGridId) ||
      !Number.isFinite(numericLat) ||
      !Number.isFinite(numericLng)
    ) {
      setLocalError("그리드 ID 또는 위경도 값이 올바르지 않습니다.");
      return;
    }

    let imgUrl: string | null = null;
    try {
      if (imageFile) {
        const uploaded = await uploadReportImage(imageFile); 
        imgUrl = uploaded.img_url;
      }
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
      return;
    }

    const success = await submitReport({
      id: user?.id ? Number(user.id) : undefined,
      grid_id: numericGridId,
      type,
      lat: numericLat,
      lng: numericLng,
      description: description.trim(),
      img_url: imgUrl,
    });

    if (success) resetForm();
  }

  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => void handleSubmit(e)}
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
                kind: "report",
                label: type || undefined,
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
                kind: "report",
                label: type || undefined,
                description: "마커 위치",
              });
            }}
          />
        </div>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-report-type">유형</label>
        <select
          id="marker-report-type"
          value={type}
          onChange={(e) => {
            const nextType = e.target.value;
            setType(nextType);
            if (!lat || !lng) return;
            setMapFocus({
              lat: Number(lat),
              lng: Number(lng),
              kind: "report",
              label: nextType,
              description: "마커 위치",
              grid_id: mapFocus?.grid_id,
            });
          }}
        >
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ImageAttachField
        key={imageKey}
        inputId="marker-report-image"
        disabled={loading}
        onFileChange={setImageFile}
      />

      {localError && (
        <div className={`${styles.notice} ${styles.noticeError} ${styles.full}`}>
          {localError}
        </div>
      )}

      <div className={`${styles.formActions} ${styles.full}`}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={loading}
        >
          {loading ? "등록 중…" : "등록"}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={resetForm}
          disabled={loading}
        >
          초기화
        </button>
      </div>
    </form>
  );
}
