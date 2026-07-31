// 담당: 피드백/관리자팀

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

export const FUTURE_DATE_PRESETS: {
  value: Exclude<DatePreset, "">;
  label: string;
}[] = [
  { value: "1m", label: "1개월 후" },
  { value: "3m", label: "3개월 후" },
  { value: "6m", label: "6개월 후" },
  { value: "1y", label: "1년 후" },
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
};

export function DatePresetChecks({
  value,
  onChange,
  idPrefix,
  presets = DATE_PRESETS,
}: DatePresetChecksProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>기간 프리셋</span>
      <div className={styles.checkGroup} role="group" aria-label="기간 프리셋">
        {presets.map((preset) => {
          const id = `${idPrefix}-preset-${preset.value}`;
          return (
            <label key={preset.value} className={styles.checkItem} htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                checked={value === preset.value}
                onChange={(e) => {
                  onChange(e.target.checked ? preset.value : "");
                }}
              />
              <span>{preset.label}</span>
            </label>
          );
        })}
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
      <div className={styles.checkGroup} role="group" aria-label="활성여부">
        {ACTIVE_OPTIONS.map((option) => {
          const id = `${idPrefix}-active-${option.value}`;
          return (
            <label key={option.value} className={styles.checkItem} htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                checked={value === option.value}
                onChange={(e) => {
                  onChange(e.target.checked ? option.value : "all");
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
