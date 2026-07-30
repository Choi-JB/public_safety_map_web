// 담당: 피드백/관리자팀

"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import { ActiveFilterChecks, DatePresetChecks } from "../shared/FilterChecks";
import { formatCreatedAt } from "../shared/formatDate";
import { MapMoveButton } from "../shared/MapMoveButton";
import { Pagination } from "../shared/Pagination";
import { RefreshIcon } from "../shared/RefreshIcon";
import { SafetyBadge } from "../shared/SafetyBadge";
import { DateInput } from "../shared/ScheduleRow";
import { TrashIcon } from "../shared/TrashIcon";
import styles from "../admin.module.css";

function authorLabel(item: {
  user_id: string;
  user?: { nickname: string } | null;
}) {
  return item.user?.nickname?.trim() || "-";
}

export function FeedbacksPanel() {
  const feedbacks = useAdminStore((s) => s.feedbacks);
  const safetyFeelings = useAdminStore((s) => s.feedbackSafetyFeelings);
  const filters = useAdminStore((s) => s.feedbackFilters);
  const loading = useAdminStore((s) => s.loading);
  const setFeedbackFilters = useAdminStore((s) => s.setFeedbackFilters);
  const applyFeedbackDatePreset = useAdminStore(
    (s) => s.applyFeedbackDatePreset,
  );
  const resetFeedbackFilters = useAdminStore((s) => s.resetFeedbackFilters);
  const loadFeedbacks = useAdminStore((s) => s.loadFeedbacks);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const openImagePreview = useAdminStore((s) => s.openImagePreview);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const mapFocus = useAdminStore((s) => s.mapFocus);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks, filters.page, filters.filter]);

  return (
    <div>
      <div className={styles.panelHeader}>피드백 관리</div>
      <div className={styles.panelBody}>
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <DatePresetChecks
              idPrefix="fb"
              value={filters.date_preset}
              onChange={applyFeedbackDatePreset}
            />
            <DateInput
              id="fb-from"
              label="등록일"
              value={filters.date_from}
              onChange={(date) =>
                setFeedbackFilters({ date_from: date, date_preset: "" })
              }
            />
            <DateInput
              id="fb-to"
              label=""
              value={filters.date_to}
              onChange={(date) =>
                setFeedbackFilters({ date_to: date, date_preset: "" })
              }
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.field}>
              <label htmlFor="fb-feeling">체감안전도</label>
              <select
                id="fb-feeling"
                value={filters.safety_feeling}
                onChange={(e) =>
                  setFeedbackFilters({ safety_feeling: e.target.value })
                }
              >
                <option value="">전체</option>
                {safetyFeelings.map((feeling) => (
                  <option key={feeling} value={feeling}>
                    {feeling}
                  </option>
                ))}
              </select>
            </div>
            <ActiveFilterChecks
              idPrefix="fb"
              value={filters.filter}
              onChange={(filter) => setFeedbackFilters({ filter, page: 1 })}
            />
            <div className={styles.field}>
              <label htmlFor="fb-keyword">검색어</label>
              <input
                id="fb-keyword"
                type="text"
                value={filters.keyword}
                placeholder="한줄평, 작성자"
                onChange={(e) =>
                  setFeedbackFilters({ keyword: e.target.value })
                }
              />
            </div>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => {
                setFeedbackFilters({ page: 1 });
                void loadFeedbacks();
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
                resetFeedbackFilters();
                void loadFeedbacks();
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
                <th>체감안전도</th>
                <th>작성자</th>
                <th>한줄평</th>
                <th>사진</th>
                <th>등록일</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {loading ? "불러오는 중…" : "피드백이 없습니다."}
                  </td>
                </tr>
              ) : (
                feedbacks.map((item) => {
                  const active = item.is_active === "Y";
                  const focused =
                    mapFocus?.kind === "feedback" && mapFocus.id === item.id;
                  const rowClass = [
                    active ? "" : styles.rowInactive,
                    focused ? styles.rowFocused : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={item.id} className={rowClass || undefined}>
                      <td>
                        <MapMoveButton
                          active={focused}
                          onClick={() =>
                            setMapFocus({
                              // 피드백은 격자 단위 — 격자 중심좌표 연동 전 미리보기
                              lat: 37.5665,
                              lng: 126.978,
                              label: item.user?.nickname || item.safety_feeling,
                              id: item.id,
                              kind: "feedback",
                            })
                          }
                        />
                      </td>
                      <td>
                        <SafetyBadge feeling={item.safety_feeling} />
                      </td>
                      <td>{authorLabel(item)}</td>
                      <td>{item.comment || "-"}</td>
                      <td>
                        {item.img_url ? (
                          <button
                            type="button"
                            className={styles.iconButton}
                            title="사진 보기"
                            aria-label="사진 보기"
                            onClick={() => {
                              if (item.img_url) {
                                openImagePreview(item.img_url);
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
                        {formatCreatedAt(item.created_at)}
                      </td>
                      <td>
                        {active ? (
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                            title="삭제"
                            aria-label="삭제"
                            onClick={() =>
                              openDeleteConfirm({
                                kind: "feedback",
                                id: item.id,
                                label: `${authorLabel(item)} · ${item.safety_feeling}`,
                              })
                            }
                          >
                            <TrashIcon />
                          </button>
                        ) : null}
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
            setFeedbackFilters({ page: Math.max(1, filters.page - 1) })
          }
          onNext={() => setFeedbackFilters({ page: filters.page + 1 })}
          disableNext={feedbacks.length < filters.limit}
        />
      </div>
    </div>
  );
}
