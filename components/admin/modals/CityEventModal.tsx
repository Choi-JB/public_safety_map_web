// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import { CITY_EVENT_TYPES } from "@/lib/api/admin";
import { CloseIcon } from "../shared/CloseIcon";
import { ImageAttachField } from "../shared/ImageAttachField";
import { isValidYmd, ScheduleRow } from "../shared/ScheduleRow";
import styles from "../admin.module.css";

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDatePart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimePart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function composeIso(date: string, time: string, fallbackTime: string) {
  const resolvedTime = time || fallbackTime;
  return new Date(`${date}T${resolvedTime}:00`).toISOString();
}

type FormState = {
  type: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  img_url: string;
};

function eventToForm(event: {
  type: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  start_at: string;
  end_at: string;
  img_url?: string | null;
}): FormState {
  return {
    type: event.type,
    title: event.title,
    description: event.description ?? "",
    lat: String(event.lat),
    lng: String(event.lng),
    start_date: toDatePart(event.start_at),
    start_time: toTimePart(event.start_at),
    end_date: toDatePart(event.end_at),
    end_time: toTimePart(event.end_at),
    img_url: event.img_url ?? "",
  };
}

export function CityEventModal() {
  const event = useAdminStore((s) => s.selectedEvent);
  const openEventDetail = useAdminStore((s) => s.openEventDetail);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const openImagePreview = useAdminStore((s) => s.openImagePreview);
  const updateCityEvent = useAdminStore((s) => s.updateCityEvent);
  const loading = useAdminStore((s) => s.loading);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!event) {
      setForm(null);
      setEditing(false);
      setLocalError(null);
      setImageFile(null);
      return;
    }
    setForm(eventToForm(event));
    setEditing(false);
    setLocalError(null);
    setImageFile(null);
  }, [event]);

  if (!event || !form) return null;

  function resetForm() {
    if (!event) return;
    setForm(eventToForm(event));
    setEditing(false);
    setLocalError(null);
    setImageFile(null);
  }

  async function handleSave() {
    if (!event || !form) return;

    if (
      !form.type ||
      !form.title ||
      !form.description ||
      !form.lat ||
      !form.lng ||
      !form.start_date ||
      !form.end_date
    ) {
      setLocalError("필수 값을 모두 입력해 주세요.");
      return;
    }

    if (!isValidYmd(form.start_date) || !isValidYmd(form.end_date)) {
      setLocalError("날짜는 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }

    setLocalError(null);

    // imageFile은 현재 API 미지원 — UI만 동일하게 유지
    void imageFile;

    const ok = await updateCityEvent({
      id: Number(event.id),
      type: form.type,
      title: form.title,
      description: form.description,
      lat: Number(form.lat),
      lng: Number(form.lng),
      start_at: composeIso(form.start_date, form.start_time, DEFAULT_START_TIME),
      end_at: composeIso(form.end_date, form.end_time, DEFAULT_END_TIME),
    });

    if (ok) setEditing(false);
  }

  const typeOptions = Array.from(
    new Set([...CITY_EVENT_TYPES, form.type].filter(Boolean)),
  );

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            도시정보 {editing ? "수정" : "상세"}
          </div>
          <div className={styles.modalHeaderActions}>
            <button
              type="button"
              className={styles.iconButton}
              title="닫기"
              aria-label="닫기"
              onClick={() => openEventDetail(null)}
              disabled={loading}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={`${styles.formGrid} ${styles.modalBody}`}>
          <div className={styles.field}>
            <label htmlFor="event-modal-type">유형</label>
            <select
              id="event-modal-type"
              value={form.type}
              disabled={!editing}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, type: e.target.value } : prev,
                )
              }
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="event-modal-title">제목</label>
            <input
              id="event-modal-title"
              value={form.title}
              readOnly={!editing}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev,
                )
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="event-modal-lat">위도</label>
            <input
              id="event-modal-lat"
              value={form.lat}
              readOnly={!editing}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, lat: e.target.value } : prev,
                )
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="event-modal-lng">경도</label>
            <input
              id="event-modal-lng"
              value={form.lng}
              readOnly={!editing}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, lng: e.target.value } : prev,
                )
              }
            />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="event-modal-desc">설명</label>
            <textarea
              id="event-modal-desc"
              value={form.description}
              readOnly={!editing}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev,
                )
              }
            />
          </div>

          <div className={`${styles.markerScheduleRow} ${styles.full}`}>
            <ScheduleRow
              idPrefix="event-modal-start"
              label="시작"
              date={form.start_date}
              time={form.start_time}
              disabled={!editing}
              onDateChange={(date) =>
                setForm((prev) =>
                  prev ? { ...prev, start_date: date } : prev,
                )
              }
              onTimeChange={(time) =>
                setForm((prev) =>
                  prev ? { ...prev, start_time: time } : prev,
                )
              }
            />
            <ScheduleRow
              idPrefix="event-modal-end"
              label="종료"
              date={form.end_date}
              time={form.end_time}
              disabled={!editing}
              onDateChange={(date) =>
                setForm((prev) => (prev ? { ...prev, end_date: date } : prev))
              }
              onTimeChange={(time) =>
                setForm((prev) => (prev ? { ...prev, end_time: time } : prev))
              }
            />
          </div>

          <ImageAttachField
            inputId="event-modal-image"
            disabled={!editing}
            existingUrl={form.img_url || null}
            onPreviewClick={(url) => openImagePreview(url)}
            onFileChange={setImageFile}
          />

          {localError && (
            <div
              className={`${styles.notice} ${styles.noticeError} ${styles.full}`}
            >
              {localError}
            </div>
          )}
        </div>

        <div className={`${styles.modalActions} ${styles.modalActionsSplit}`}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={() =>
              openDeleteConfirm({
                kind: "event",
                id: event.id,
                label: `${event.type} · ${event.title}`,
              })
            }
            disabled={loading}
          >
            삭제
          </button>
          <div className={styles.modalActionsRight}>
            {!editing ? (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setEditing(true)}
              >
                수정
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.button}
                  onClick={resetForm}
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={() => void handleSave()}
                  disabled={loading}
                >
                  저장
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
