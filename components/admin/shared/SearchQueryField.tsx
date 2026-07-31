// 담당: 피드백/관리자팀

import type { KeyboardEvent } from "react";
import styles from "../admin.module.css";

export type SearchMode = "user" | "keyword";

type Props = {
  idPrefix: string;
  mode: SearchMode;
  query: string;
  /** false면 키워드만 (도시정보) */
  showModeSelect?: boolean;
  onModeChange?: (mode: SearchMode) => void;
  onQueryChange: (query: string) => void;
  onSubmit?: () => void;
};

export function SearchQueryField({
  idPrefix,
  mode,
  query,
  showModeSelect = true,
  onModeChange,
  onQueryChange,
  onSubmit,
}: Props) {
  const inputId = `${idPrefix}-search-query`;
  const placeholder =
    !showModeSelect || mode === "keyword"
      ? "검색어 입력"
      : "닉네임 입력";

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    onSubmit?.();
  }

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>검색</label>
      <div className={styles.searchQueryRow}>
        {showModeSelect && (
          <select
            aria-label="검색 유형"
            value={mode}
            onChange={(e) => onModeChange?.(e.target.value as SearchMode)}
          >
            <option value="user">유저</option>
            <option value="keyword">키워드</option>
          </select>
        )}
        <input
          id={inputId}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
