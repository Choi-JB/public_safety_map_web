// 담당: 피드백/관리자팀

import type { ReactNode } from "react";
import type { ActiveFilter, DatePreset } from "@/lib/api/admin";
import styles from "../admin.module.css";

export const DATE_PRESETS: { value: Exclude<DatePreset, "">; label: string }[] =
  [
    { value: "1y", label: "1년전" },
    { value: "6m", label: "6개월" },
    { value: "3m", label: "3개월" },
    { value: "1m", label: "1개월" },
  ];

export const REPORT_DATE_PRESETS: {
  value: Exclude<DatePreset, "">;
  label: string;
}[] = [ ...DATE_PRESETS,{ value: "today", label: "신규" }];

export const EVENT_DATE_PRESETS: {
  value: Exclude<DatePreset, "">;
  label: string;
}[] = [
  { value: "this_week", label: "이번 주" },
  { value: "this_month", label: "이번 달" },
  { value: "this_year", label: "올해" },
];

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "active", label: "활성" },
  { value: "inactive", label: "비활성" },
  { value: "all", label: "전체" },
];

type DatePresetChecksProps = {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  idPrefix: string;
  presets?: { value: Exclude<DatePreset, "">; label: string }[];
  /** 프리셋 pill들과 같은 그룹에 이어 붙일 버튼(예: "직접 입력") */
  trailing?: ReactNode;
};

export function DatePresetChecks({
  value,
  onChange,
  idPrefix,
  presets = DATE_PRESETS,
  trailing,
}: DatePresetChecksProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>기간 프리셋</span>
      <div
        className={styles.filterPillGroup}
        role="group"
        aria-label="기간 프리셋"
      >
        {presets.map((preset) => {
          const active = value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              id={`${idPrefix}-preset-${preset.value}`}
              className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
              aria-pressed={active}
              onClick={() => onChange(active ? "" : preset.value)}
            >
              {preset.label}
            </button>
          );
        })}
        {trailing}
      </div>
    </div>
  );
}

type ActiveFilterChecksProps = {
  value: ActiveFilter;
  onChange: (filter: ActiveFilter) => void;
  idPrefix: string;
};

export function ActiveFilterChecks({
  value,
  onChange,
  idPrefix,
}: ActiveFilterChecksProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>활성여부</span>
      <div
        className={styles.filterPillGroup}
        role="group"
        aria-label="활성여부"
      >
        {ACTIVE_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              id={`${idPrefix}-active-${option.value}`}
              className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
              aria-pressed={active}
              onClick={() => onChange(active ? "all" : option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
