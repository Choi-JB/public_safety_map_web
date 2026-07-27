// 담당: 피드백/관리자팀

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAdminStore } from "@/store/adminStore";
import { CITY_EVENT_TYPES, REPORT_TYPES } from "@/lib/api/admin";
import styles from "../admin.module.css";

const emptyForm = {
  type: "교통사고" as string,
  title: "",
  description: "",
  lat: "",
  lng: "",
  start_at: "",
  end_at: "",
};

export function MarkersPanel() {
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const submitCityEvent = useAdminStore((s) => s.submitCityEvent);
  const loading = useAdminStore((s) => s.loading);
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);

  const isCityType = useMemo(
    () => (CITY_EVENT_TYPES as readonly string[]).includes(form.type),
    [form.type],
  );

  const canSubmit =
    Boolean(form.type && form.title && form.description && form.lat && form.lng) &&
    (!isCityType || (Boolean(form.start_at) && Boolean(form.end_at)));

  function applyMapFocusToForm() {
    if (!mapFocus) return;
    setForm((prev) => ({
      ...prev,
      lat: String(mapFocus.lat),
      lng: String(mapFocus.lng),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!canSubmit) {
      setLocalError("필수 값을 모두 입력해 주세요. 좌표가 없으면 등록할 수 없습니다.");
      return;
    }

    if (!isCityType) {
      setLocalError(
        "제보 유형 마커 API(POST /admin/markers)는 아직 미구현입니다. 도시정보 유형만 등록할 수 있습니다.",
      );
      return;
    }

    const start = new Date(form.start_at).toISOString();
    const end = new Date(form.end_at).toISOString();

    await submitCityEvent({
      type: form.type,
      title: form.title,
      description: form.description,
      lat: Number(form.lat),
      lng: Number(form.lng),
      start_at: start,
      end_at: end,
    });

    setForm(emptyForm);
  }

  return (
    <div>
      <div className={styles.panelHeader}>마커 등록</div>
      <div className={styles.panelBody}>
        <p className={styles.hint}>
          제보 5종 + 도시정보 3종. 도시정보 유형은 `POST /admin/create-event`로
          등록합니다. 제보 유형은 마커 API 미구현 상태입니다.
        </p>

        <form className={styles.formGrid} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.field}>
            <label htmlFor="marker-type">마커 유형</label>
            <select
              id="marker-type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <optgroup label="제보">
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </optgroup>
              <optgroup label="도시정보">
                {CITY_EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="marker-title">제목</label>
            <input
              id="marker-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="marker-desc">설명</label>
            <textarea
              id="marker-desc"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="marker-lat">위도</label>
            <input
              id="marker-lat"
              value={form.lat}
              onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
              placeholder="37.5665"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="marker-lng">경도</label>
            <input
              id="marker-lng"
              value={form.lng}
              onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
              placeholder="126.9780"
            />
          </div>

          {isCityType && (
            <>
              <div className={styles.field}>
                <label htmlFor="marker-start">시작 시각</label>
                <input
                  id="marker-start"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_at: e.target.value }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="marker-end">종료 시각</label>
                <input
                  id="marker-end"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_at: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          <div className={`${styles.formActions} ${styles.full}`}>
            <button
              type="button"
              className={styles.button}
              onClick={applyMapFocusToForm}
              disabled={!mapFocus}
            >
              지도 좌표 가져오기
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                if (form.lat && form.lng) {
                  setMapFocus({
                    lat: Number(form.lat),
                    lng: Number(form.lng),
                    label: form.title || form.type,
                  });
                }
              }}
            >
              좌표 미리보기
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={!canSubmit || loading}
            >
              등록
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setForm(emptyForm);
                setLocalError(null);
              }}
            >
              초기화
            </button>
          </div>
        </form>

        {localError && (
          <div className={`${styles.notice} ${styles.noticeError}`} style={{ marginTop: 12 }}>
            {localError}
          </div>
        )}
      </div>
    </div>
  );
}
