// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import {
  ActiveFilterChecks,
  DatePresetChecks,
  EVENT_DATE_PRESETS,
} from "../shared/FilterChecks";
import { formatDateRange } from "../shared/formatDate";
import { MapMoveButton } from "../shared/MapMoveButton";
import { Pagination } from "../shared/Pagination";
import { RefreshIcon } from "../shared/RefreshIcon";
import { RestoreIcon } from "../shared/RestoreIcon";
import { SearchQueryField } from "../shared/SearchQueryField";
import { TrashIcon } from "../shared/TrashIcon";
import styles from "../admin.module.css";
import { getDateRangeFromYearMonth } from "@/store/adminStore";

type EventStatus = "scheduled" | "ongoing" | "ended";

function getEventStatus(
  startAt: string,
  endAt: string,
  now: number,
): EventStatus | null {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (now < start) return "scheduled";
  if (now >= end) return "ended";
  return "ongoing";
}

const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  scheduled: "예정",
  ongoing: "진행",
  ended: "종료",
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function yearOptions(centerYear: number) {
  const years: number[] = [];
  for (let y = centerYear - 5; y <= centerYear + 5; y += 1) years.push(y);
  return years;
}

function parseYearMonth(value: string) {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function CityEventsPanel() {
  const events = useAdminStore((s) => s.events);
  const eventTypes = useAdminStore((s) => s.eventTypes);
  const filters = useAdminStore((s) => s.eventFilters);
  const loading = useAdminStore((s) => s.loading);
  const setEventFilters = useAdminStore((s) => s.setEventFilters);
  const applyEventDatePreset = useAdminStore((s) => s.applyEventDatePreset);
  const resetEventFilters = useAdminStore((s) => s.resetEventFilters);
  const loadEvents = useAdminStore((s) => s.loadEvents);
  const openEventDetail = useAdminStore((s) => s.openEventDetail);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const openRestoreConfirm = useAdminStore((s) => s.openRestoreConfirm);
  const openImagePreview = useAdminStore((s) => s.openImagePreview);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const mapFocus = useAdminStore((s) => s.mapFocus);
  const [now, setNow] = useState(() => Date.now());

  const currentYear = new Date().getFullYear();
  const fromYm = parseYearMonth(filters.date_from) ?? {
    year: currentYear,
    month: new Date().getMonth() + 1,
  };
  const toYm = parseYearMonth(filters.date_to) ?? {
    year: currentYear,
    month: new Date().getMonth() + 1,
  };

  function applyYearMonthRange(
    nextFrom: { year: number; month: number },
    nextTo: { year: number; month: number },
  ) {
    let from = nextFrom;
    let to = nextTo;
    const fromKey = from.year * 12 + from.month;
    const toKey = to.year * 12 + to.month;
    if (fromKey > toKey) {
      // 시작이 종료보다 뒤면 종료를 시작에 맞춤
      to = { ...from };
    }
    const range = getDateRangeFromYearMonth(
      from.year,
      from.month,
      to.year,
      to.month,
    );
    setEventFilters({
      date_preset: "",
      date_from: range.date_from,
      date_to: range.date_to,
      page: 1,
    });
  }

  useEffect(() => {
    void loadEvents();
    return () => {
      setMapFocus(null);
    }
  }, [loadEvents, filters.page, filters.filter]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelHeader}>도시정보 관리</div>
      <div className={styles.panelBody}>
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <DatePresetChecks
              idPrefix="event"
              value={filters.date_preset}
              onChange={applyEventDatePreset}
              presets={EVENT_DATE_PRESETS}
            />
            <div className={styles.field}>
              <span className={styles.fieldLabel}>기간 (년/월)</span>
              <div className={styles.yearMonthRange}>
                <select
                  className={styles.yearSelect}
                  aria-label="시작 연도"
                  value={fromYm.year}
                  onChange={(e) =>
                    applyYearMonthRange(
                      { year: Number(e.target.value), month: fromYm.month },
                      toYm,
                    )
                  }
                >
                  {yearOptions(currentYear).map((year) => (
                    <option key={`from-y-${year}`} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
                <select
                  className={styles.monthSelect}
                  aria-label="시작 월"
                  value={fromYm.month}
                  onChange={(e) =>
                    applyYearMonthRange(
                      { year: fromYm.year, month: Number(e.target.value) },
                      toYm,
                    )
                  }
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={`from-m-${month}`} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
                <span className={styles.yearMonthSep}>~</span>
                <select
                  className={styles.yearSelect}
                  aria-label="종료 연도"
                  value={toYm.year}
                  onChange={(e) =>
                    applyYearMonthRange(fromYm, {
                      year: Number(e.target.value),
                      month: toYm.month,
                    })
                  }
                >
                  {yearOptions(currentYear).map((year) => (
                    <option key={`to-y-${year}`} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
                <select
                  className={styles.monthSelect}
                  aria-label="종료 월"
                  value={toYm.month}
                  onChange={(e) =>
                    applyYearMonthRange(fromYm, {
                      year: toYm.year,
                      month: Number(e.target.value),
                    })
                  }
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={`to-m-${month}`} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.field}>
              <label htmlFor="event-type">유형</label>
              <select
                id="event-type"
                value={filters.type}
                onChange={(e) => setEventFilters({ type: e.target.value })}
              >
                <option value="">전체</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="event-status">상태</label>
              <select
                id="event-status"
                value={filters.status}
                onChange={(e) =>
                  setEventFilters({
                    status: e.target.value as typeof filters.status,
                    page: 1,
                  })
                }
              >
                <option value="">전체</option>
                <option value="scheduled">예정</option>
                <option value="ongoing">진행</option>
                <option value="ended">종료</option>
              </select>
            </div>
            <ActiveFilterChecks
              idPrefix="event"
              value={filters.filter}
              onChange={(filter) => setEventFilters({ filter, page: 1 })}
            />
            <SearchQueryField
              idPrefix="event"
              mode="keyword"
              query={filters.keyword}
              showModeSelect={false}
              onQueryChange={(keyword) => setEventFilters({ keyword })}
              onSubmit={() => {
                setEventFilters({ page: 1 });
                void loadEvents();
              }}
            />
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => {
                setEventFilters({ page: 1 });
                void loadEvents();
              }}
            >
              조회
            </button>
            <button
              type="button"
              className={styles.iconButton}
              title="필터 초기화"
              aria-label="필터 초기화"
              onClick={() => {
                resetEventFilters();
                void loadEvents();
              }}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>지도</th>
                <th>유형</th>
                <th>제목</th>
                <th>사진</th>
                <th>기간</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    {loading ? "불러오는 중…" : "도시정보가 없습니다."}
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const active = event.is_active !== "N";
                  const status = getEventStatus(
                    event.start_at,
                    event.end_at,
                    now,
                  );
                  const focused =
                    mapFocus?.kind === "event" && mapFocus.id === event.id;
                  const rowClass = [
                    styles.rowClickable,
                    active ? "" : styles.rowInactive,
                    focused ? styles.rowFocused : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={event.id}
                      className={rowClass}
                      onClick={() => openEventDetail(event)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <MapMoveButton
                          active={focused}
                          onClick={() =>
                            setMapFocus({
                              lat: Number(event.lat),
                              lng: Number(event.lng),
                              label: event.title,
                              id: event.id,
                              kind: "event",
                            })
                          }
                        />
                      </td>
                      <td>{event.type}</td>
                      <td>
                        <div className={styles.eventTitleCell}>
                          {status && (
                            <span
                              className={`${styles.badge} ${
                                status === "scheduled"
                                  ? styles.eventStatusScheduled
                                  : status === "ongoing"
                                    ? styles.eventStatusOngoing
                                    : styles.eventStatusEnded
                              }`}
                            >
                              {EVENT_STATUS_LABEL[status]}
                            </span>
                          )}
                          <span>{event.title}</span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {event.img_url ? (
                          <button
                            type="button"
                            className={styles.iconButton}
                            title="사진 보기"
                            aria-label="사진 보기"
                            onClick={() => {
                              if (event.img_url) {
                                openImagePreview(event.img_url);
                              }
                            }}
                          >
                            ▤
                          </button>
                        ) : (
                          <span className={styles.hint}>없음</span>
                        )}
                      </td>
                      <td className={styles.dateCell}>
                        {formatDateRange(event.start_at, event.end_at)}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {active ? (
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                            title="삭제"
                            aria-label="삭제"
                            onClick={() =>
                              openDeleteConfirm({
                                kind: "event",
                                id: event.id,
                                label: `${event.type} · ${event.title}`,
                              })
                            }
                          >
                            <TrashIcon />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.iconButton}
                            title="복구"
                            aria-label="복구"
                            disabled={loading}
                            onClick={() =>
                              openRestoreConfirm({
                                kind: "event",
                                id: event.id,
                                label: `${event.type} · ${event.title}`,
                              })
                            }
                          >
                            <RestoreIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={filters.page}
          onPrev={() =>
            setEventFilters({ page: Math.max(1, filters.page - 1) })
          }
          onNext={() => setEventFilters({ page: filters.page + 1 })}
          disableNext={events.length < filters.limit}
        />
      </div>
    </div>
  );
}
