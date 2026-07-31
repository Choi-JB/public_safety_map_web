// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import {
  ActiveFilterChecks,
  DatePresetChecks,
  FUTURE_DATE_PRESETS,
} from "../shared/FilterChecks";
import { formatCreatedAt, formatDateRange } from "../shared/formatDate";
import { MapMoveButton } from "../shared/MapMoveButton";
import { Pagination } from "../shared/Pagination";
import { RefreshIcon } from "../shared/RefreshIcon";
import { RestoreIcon } from "../shared/RestoreIcon";
import { DateInput } from "../shared/ScheduleRow";
import { TrashIcon } from "../shared/TrashIcon";
import styles from "../admin.module.css";

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
    <div>
      <div className={styles.panelHeader}>도시정보 관리</div>
      <div className={styles.panelBody}>
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <DatePresetChecks
              idPrefix="event"
              value={filters.date_preset}
              onChange={applyEventDatePreset}
              presets={FUTURE_DATE_PRESETS}
            />
            <DateInput
              id="event-from"
              label="기간"
              value={filters.date_from}
              onChange={(date) =>
                setEventFilters({ date_from: date, date_preset: "" })
              }
            />
            <DateInput
              id="event-to"
              label=""
              value={filters.date_to}
              onChange={(date) =>
                setEventFilters({ date_to: date, date_preset: "" })
              }
            />
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
            <ActiveFilterChecks
              idPrefix="event"
              value={filters.filter}
              onChange={(filter) => setEventFilters({ filter, page: 1 })}
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
