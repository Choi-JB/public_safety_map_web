// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import { CITY_EVENT_TYPES } from "@/lib/api/admin";
import { CloseIcon } from "../shared/CloseIcon";
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

function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
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
  start_date_text: string;
  end_date: string;
  end_time: string;
  end_date_text: string;
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
  const startDate = toDatePart(event.start_at);
  const endDate = toDatePart(event.end_at);
  return {
    type: event.type,
    title: event.title,
    description: event.description ?? "",
    lat: String(event.lat),
    lng: String(event.lng),
    start_date: startDate,
    start_time: toTimePart(event.start_at),
    start_date_text: startDate,
    end_date: endDate,
    end_time: toTimePart(event.end_at),
    end_date_text: endDate,
    img_url: event.img_url ?? "",
  };
}

type DateTimeFieldProps = {
  idPrefix: string;
  label: string;
  date: string;
  dateText: string;
  time: string;
  defaultTimeLabel: string;
  editing: boolean;
  onDateChange: (date: string) => void;
  onDateTextChange: (text: string) => void;
  onTimeChange: (time: string) => void;
};

function DateTimeField({
  idPrefix,
  label,
  date,
  dateText,
  time,
  defaultTimeLabel,
  editing,
  onDateChange,
  onDateTextChange,
  onTimeChange,
}: DateTimeFieldProps) {
  return (
    <div className={`${styles.field} ${styles.full}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.dateTimeRow}>
        <div className={styles.dateTimePart}>
          <label htmlFor={`${idPrefix}-date`}>달력</label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={date}
            disabled={!editing}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        <div className={styles.dateTimePart}>
          <label htmlFor={`${idPrefix}-text`}>직접 입력 (YYYY-MM-DD)</label>
          <input
            id={`${idPrefix}-text`}
            type="text"
            inputMode="numeric"
            placeholder="2026-08-01"
            value={dateText}
            readOnly={!editing}
            onChange={(e) => onDateTextChange(e.target.value)}
            onBlur={() => {
              if (!editing) return;
              if (isValidYmd(dateText)) {
                onDateChange(dateText);
              }
            }}
          />
        </div>
        <div className={styles.dateTimePart}>
          <label htmlFor={`${idPrefix}-time`}>
            시간 (미선택 시 {defaultTimeLabel})
          </label>
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={time}
            disabled={!editing}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
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

  useEffect(() => {
    if (!event) {
      setForm(null);
      setEditing(false);
      setLocalError(null);
      return;
    }
    setForm(eventToForm(event));
    setEditing(false);
    setLocalError(null);
  }, [event]);

  if (!event || !form) return null;

  function resetForm() {
    if (!event) return;
    setForm(eventToForm(event));
    setEditing(false);
    setLocalError(null);
  }

  async function handleSave() {
    if (!event || !form) return;

    const startDate = isValidYmd(form.start_date_text)
      ? form.start_date_text
      : form.start_date;
    const endDate = isValidYmd(form.end_date_text)
      ? form.end_date_text
      : form.end_date;

    if (
      !form.type ||
      !form.title ||
      !form.description ||
      !form.lat ||
      !form.lng ||
      !startDate ||
      !endDate
    ) {
      setLocalError("필수 값을 모두 입력해 주세요.");
      return;
    }

    if (!isValidYmd(startDate) || !isValidYmd(endDate)) {
      setLocalError("날짜는 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }

    setLocalError(null);

    const ok = await updateCityEvent({
      id: Number(event.id),
      type: form.type,
      title: form.title,
      description: form.description,
      lat: Number(form.lat),
      lng: Number(form.lng),
      start_at: composeIso(startDate, form.start_time, DEFAULT_START_TIME),
      end_at: composeIso(endDate, form.end_time, DEFAULT_END_TIME),
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

          <DateTimeField
            idPrefix="event-modal-start"
            label="시작 시각"
            date={form.start_date}
            dateText={form.start_date_text}
            time={form.start_time}
            defaultTimeLabel="오전 9시"
            editing={editing}
            onDateChange={(date) =>
              setForm((prev) =>
                prev
                  ? { ...prev, start_date: date, start_date_text: date }
                  : prev,
              )
            }
            onDateTextChange={(text) =>
              setForm((prev) => {
                if (!prev) return prev;
                const next = { ...prev, start_date_text: text };
                if (isValidYmd(text)) next.start_date = text;
                return next;
              })
            }
            onTimeChange={(time) =>
              setForm((prev) =>
                prev ? { ...prev, start_time: time } : prev,
              )
            }
          />

          <DateTimeField
            idPrefix="event-modal-end"
            label="종료 시각"
            date={form.end_date}
            dateText={form.end_date_text}
            time={form.end_time}
            defaultTimeLabel="오후 6시"
            editing={editing}
            onDateChange={(date) =>
              setForm((prev) =>
                prev
                  ? { ...prev, end_date: date, end_date_text: date }
                  : prev,
              )
            }
            onDateTextChange={(text) =>
              setForm((prev) => {
                if (!prev) return prev;
                const next = { ...prev, end_date_text: text };
                if (isValidYmd(text)) next.end_date = text;
                return next;
              })
            }
            onTimeChange={(time) =>
              setForm((prev) => (prev ? { ...prev, end_time: time } : prev))
            }
          />

          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="event-modal-photo">사진</label>
            {form.img_url ? (
              <div className={styles.photoField}>
                <input
                  id="event-modal-photo"
                  value={form.img_url}
                  readOnly
                />
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => openImagePreview(form.img_url)}
                >
                  미리보기
                </button>
              </div>
            ) : (
              <input id="event-modal-photo" value="없음" readOnly />
            )}
            <span className={styles.hint}>
              도시정보 사진 필드는 현재 API에서 미지원입니다.
            </span>
          </div>

          {localError && (
            <div className={`${styles.notice} ${styles.noticeError} ${styles.full}`}>
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
