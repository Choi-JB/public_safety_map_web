// 담당: 피드백/관리자팀

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "../admin.module.css";

export function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function isValidHm(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function formatDateTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function formatTimeTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DateInputProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (date: string) => void;
};

/** 달력 버튼과 YYYY-MM-DD 직접 입력을 함께 지원하는 날짜 입력창 */
export function DateInput({
  id,
  label,
  value,
  disabled = false,
  onChange,
}: DateInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [dateText, setDateText] = useState(value);

  useEffect(() => {
    setDateText(value);
  }, [value]);

  function openPicker() {
    if (!pickerRef.current || disabled) return;
    try {
      pickerRef.current.showPicker();
    } catch {
      pickerRef.current.click();
    }
  }

  function handleTextChange(e: ChangeEvent<HTMLInputElement>) {
    const next = formatDateTyping(e.target.value);
    setDateText(next);
    if (isValidYmd(next)) onChange(next);
  }

  function handleBlur() {
    const next = formatDateTyping(dateText);
    setDateText(next);
    if (isValidYmd(next)) {
      onChange(next);
    } else if (value) {
      setDateText(value);
    }
  }

  return (
    <div className={`${styles.field} ${styles.dateInputField}`}>
      <label htmlFor={`${id}-date-text`}>{label}</label>
      <div
        className={`${styles.iconInput} ${disabled ? styles.iconInputDisabled : ""}`}
      >
        <button
          type="button"
          className={styles.iconInputBtn}
          title="날짜 선택"
          aria-label={`${label} 날짜 선택`}
          disabled={disabled}
          onClick={openPicker}
        >
          <CalendarIcon />
        </button>
        <input
          ref={pickerRef}
          id={`${id}-date-picker`}
          type="date"
          className={styles.hiddenPicker}
          value={isValidYmd(value) ? value : ""}
          disabled={disabled}
          onChange={(e) => {
            setDateText(e.target.value);
            onChange(e.target.value);
          }}
          tabIndex={-1}
        />
        <input
          id={`${id}-date-text`}
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          maxLength={10}
          className={`${styles.iconInputField} ${styles.dateTextInput}`}
          value={dateText}
          readOnly={disabled}
          onChange={handleTextChange}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}

type ScheduleRowProps = {
  idPrefix: string;
  label: string;
  date: string;
  time: string;
  disabled?: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

export function ScheduleRow({
  idPrefix,
  label,
  date,
  time,
  disabled = false,
  onDateChange,
  onTimeChange,
}: ScheduleRowProps) {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const timePickerRef = useRef<HTMLInputElement>(null);
  const [dateText, setDateText] = useState(date);
  const [timeText, setTimeText] = useState(time);

  useEffect(() => {
    setDateText(date);
  }, [date]);

  useEffect(() => {
    setTimeText(time);
  }, [time]);

  function openPicker(input: HTMLInputElement | null) {
    if (!input || disabled) return;
    try {
      input.showPicker();
    } catch {
      input.click();
    }
  }

  function handleDateTextChange(e: ChangeEvent<HTMLInputElement>) {
    const next = formatDateTyping(e.target.value);
    setDateText(next);
    if (isValidYmd(next)) onDateChange(next);
  }

  function handleDateTextBlur() {
    const next = formatDateTyping(dateText);
    setDateText(next);
    if (isValidYmd(next)) {
      onDateChange(next);
    } else if (date) {
      setDateText(date);
    }
  }

  function handleTimeTextChange(e: ChangeEvent<HTMLInputElement>) {
    const next = formatTimeTyping(e.target.value);
    setTimeText(next);
    if (isValidHm(next)) onTimeChange(next);
  }

  function handleTimeTextBlur() {
    const next = formatTimeTyping(timeText);
    if (isValidHm(next)) {
      setTimeText(next);
      onTimeChange(next);
    } else if (time) {
      setTimeText(time);
    } else {
      setTimeText(next);
    }
  }

  return (
    <div className={styles.scheduleLine}>
      <span className={styles.scheduleLabel}>{label}</span>

      <div className={`${styles.iconInput} ${disabled ? styles.iconInputDisabled : ""}`}>
        <button
          type="button"
          className={styles.iconInputBtn}
          title="날짜 선택"
          aria-label={`${label} 날짜 선택`}
          disabled={disabled}
          onClick={() => openPicker(datePickerRef.current)}
        >
          <CalendarIcon />
        </button>
        <input
          ref={datePickerRef}
          id={`${idPrefix}-date-picker`}
          type="date"
          className={styles.hiddenPicker}
          value={isValidYmd(date) ? date : ""}
          disabled={disabled}
          onChange={(e) => {
            setDateText(e.target.value);
            onDateChange(e.target.value);
          }}
          tabIndex={-1}
        />
        <input
          id={`${idPrefix}-date-text`}
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          className={styles.iconInputField}
          value={dateText}
          readOnly={disabled}
          onChange={handleDateTextChange}
          onBlur={handleDateTextBlur}
        />
      </div>

      <div className={`${styles.iconInput} ${disabled ? styles.iconInputDisabled : ""}`}>
        <button
          type="button"
          className={styles.iconInputBtn}
          title="시간 선택"
          aria-label={`${label} 시간 선택`}
          disabled={disabled}
          onClick={() => openPicker(timePickerRef.current)}
        >
          <ClockIcon />
        </button>
        <input
          ref={timePickerRef}
          id={`${idPrefix}-time-picker`}
          type="time"
          className={styles.hiddenPicker}
          value={isValidHm(time) ? time : ""}
          disabled={disabled}
          onChange={(e) => {
            setTimeText(e.target.value);
            onTimeChange(e.target.value);
          }}
          tabIndex={-1}
        />
        <input
          id={`${idPrefix}-time-text`}
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          className={styles.iconInputField}
          value={timeText}
          readOnly={disabled}
          onChange={handleTimeTextChange}
          onBlur={handleTimeTextBlur}
        />
      </div>
    </div>
  );
}
