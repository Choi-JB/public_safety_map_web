// 담당: 피드백/관리자팀

"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/store/adminStore";
import styles from "../../admin.module.css";
import { ImageAttachField } from "../../shared/ImageAttachField";
import { isValidYmd, ScheduleRow } from "../../shared/ScheduleRow";
import { useAuthStore } from "@/store/authStore";

const CITY_TYPE_OPTIONS = ["행사", "인파 밀집", "교통 통제", "기타"] as const;
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

type FormState = {
  type: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

const emptyForm: FormState = {
  type: "",
  title: "",
  description: "",
  lat: "",
  lng: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
};

function composeIso(date: string, time: string, fallbackTime: string) {
  const resolvedTime = time || fallbackTime;
  return new Date(`${date}T${resolvedTime}:00`).toISOString();
}

export function CityEventMarkerForm() {
  const submitCityEvent = useAdminStore((s) => s.submitCityEvent);
  const loading = useAdminStore((s) => s.loading);
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const { user } = useAuthStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
    setImageKey((k) => k + 1);
    setLocalError(null);
  }

  function applyMapFocus() {
    if (!mapFocus) {
      setLocalError("지도에서 위치를 선택한 뒤 좌표를 가져와 주세요.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      lat: String(mapFocus.lat),
      lng: String(mapFocus.lng),
    }));
    setLocalError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (
      !form.type ||
      !form.title.trim() ||
      !form.description.trim() ||
      !form.lat ||
      !form.lng ||
      !form.startDate ||
      !form.endDate
    ) {
      setLocalError("유형, 제목, 설명, 시작/종료 날짜, 위경도를 모두 입력해 주세요.");
      return;
    }

    if (!isValidYmd(form.startDate) || !isValidYmd(form.endDate)) {
      setLocalError("날짜는 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLocalError("위경도 좌표가 올바르지 않습니다.");
      return;
    }

    // 이미지 첨부는 UI만 지원 — create-event API에 파일 필드 없음
    void imageFile;

    await submitCityEvent({
      id: user?.id?.toString() || undefined,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      lat,
      lng,
      start_at: composeIso(form.startDate, form.startTime, DEFAULT_START_TIME),
      end_at: composeIso(form.endDate, form.endTime, DEFAULT_END_TIME),
    });

    // 성공 시 store가 message/탭 전환 처리. 에러면 store.error에 남음.
    const { error } = useAdminStore.getState();
    if (!error) resetForm();
  }

  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => void handleSubmit(e)}
      aria-label="도시정보 마커 등록"
    >
      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-type">유형</label>
        <select
          id="marker-city-type"
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
        >
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

      <div className={`${styles.markerScheduleRow} ${styles.full}`}>
        <ScheduleRow
          idPrefix="marker-city-start"
          label="시작"
          date={form.startDate}
          time={form.startTime}
          onDateChange={(date) => setForm((p) => ({ ...p, startDate: date }))}
          onTimeChange={(time) => setForm((p) => ({ ...p, startTime: time }))}
        />
        <ScheduleRow
          idPrefix="marker-city-end"
          label="종료"
          date={form.endDate}
          time={form.endTime}
          onDateChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
          onTimeChange={(time) => setForm((p) => ({ ...p, endTime: time }))}
        />
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-title">제목</label>
        <input
          id="marker-city-title"
          placeholder="도시정보 제목을 입력하세요"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="marker-city-desc">설명</label>
        <textarea
          id="marker-city-desc"
          rows={4}
          placeholder="도시정보 내용을 입력하세요"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
        />
      </div>

      <ImageAttachField
        key={imageKey}
        inputId="marker-city-image"
        onFileChange={setImageFile}
      />

      <div className={`${styles.coordRow} ${styles.full}`}>
        <div className={styles.field}>
          <label htmlFor="marker-city-lat">위도</label>
          <input
            id="marker-city-lat"
            placeholder="37.5665"
            value={form.lat}
            onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="marker-city-lng">경도</label>
          <input
            id="marker-city-lng"
            placeholder="126.9780"
            value={form.lng}
            onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={applyMapFocus}
          disabled={!mapFocus}
        >
          지도에서 좌표 가져오기
        </button>
      </div>

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
