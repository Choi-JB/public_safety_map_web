// 담당: 피드백/관리자팀

"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/adminStore";
import {
  ActiveFilterChecks,
  DatePresetChecks,
  REPORT_DATE_PRESETS,
} from "../shared/FilterChecks";
import { formatCreatedAt } from "../shared/formatDate";
import { MapMoveButton } from "../shared/MapMoveButton";
import { Pagination } from "../shared/Pagination";
import { RefreshIcon } from "../shared/RefreshIcon";
import { RestoreIcon } from "../shared/RestoreIcon";
import { DateInput } from "../shared/ScheduleRow";
import { TrashIcon } from "../shared/TrashIcon";
import styles from "../admin.module.css";

function authorLabel(report: {
  user_id: string;
  user?: { nickname: string } | null;
}) {
  return report.user?.nickname?.trim() || "-";
}

export function ReportsPanel() {
  const reports = useAdminStore((s) => s.reports);
  const reportTypes = useAdminStore((s) => s.reportTypes);
  const filters = useAdminStore((s) => s.reportFilters);
  const loading = useAdminStore((s) => s.loading);
  const setReportFilters = useAdminStore((s) => s.setReportFilters);
  const applyReportDatePreset = useAdminStore((s) => s.applyReportDatePreset);
  const resetReportFilters = useAdminStore((s) => s.resetReportFilters);
  const loadReports = useAdminStore((s) => s.loadReports);
  const openDeleteConfirm = useAdminStore((s) => s.openDeleteConfirm);
  const openRestoreConfirm = useAdminStore((s) => s.openRestoreConfirm);
  const openImagePreview = useAdminStore((s) => s.openImagePreview);
  const setMapFocus = useAdminStore((s) => s.setMapFocus);
  const mapFocus = useAdminStore((s) => s.mapFocus);


  useEffect(() => {
    void loadReports();
    return () => {
      setMapFocus(null);
    }
  }, [loadReports, filters.page, filters.filter]);

  return (
    <div>
      <div className={styles.panelHeader}>제보 관리</div>
      <div className={styles.panelBody}>
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <DatePresetChecks
              idPrefix="report"
              value={filters.date_preset}
              onChange={applyReportDatePreset}
              presets={REPORT_DATE_PRESETS}
            />
            <DateInput
              id="report-from"
              label="등록일"
              value={filters.date_from}
              onChange={(date) =>
                setReportFilters({ date_from: date, date_preset: "" })
              }
            />
            
            <DateInput
              id="report-to"
              label=""
              value={filters.date_to}
              onChange={(date) =>
                setReportFilters({ date_to: date, date_preset: "" })
              }
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.field}>
              <label htmlFor="report-type">유형</label>
              <select
                id="report-type"
                value={filters.type}
                onChange={(e) => setReportFilters({ type: e.target.value })}
              >
                <option value="">전체</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <ActiveFilterChecks
              idPrefix="report"
              value={filters.filter}
              onChange={(filter) => setReportFilters({ filter, page: 1 })}
            />
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => {
                setReportFilters({ page: 1 });
                void loadReports();
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
                resetReportFilters();
                void loadReports();
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
                <th>작성자</th>
                <th>설명</th>
                <th>사진</th>
                <th>등록일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {loading ? "불러오는 중…" : "제보가 없습니다."}
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const active = report.is_active === "Y";
                  const focused =
                    mapFocus?.kind === "report" && mapFocus.id === report.id;
                  const rowClass = [
                    active ? "" : styles.rowInactive,
                    focused ? styles.rowFocused : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={report.id} className={rowClass || undefined}>
                      <td>
                        <MapMoveButton
                          active={focused}
                          onClick={
                            () => setMapFocus({
                              lat: Number(report.lat),
                              lng: Number(report.lng),
                              label: report.type,
                              id: report.id,
                              kind: "report",
                              description: report.description,
                            })
                            
                          }
                        />
                      </td>
                      <td>{report.type}</td>
                      <td>{authorLabel(report)}</td>
                      <td>{report.description || "-"}</td>
                      <td>
                        {report.img_url ? (
                          <button
                            type="button"
                            className={styles.iconButton}
                            title="사진 보기"
                            aria-label="사진 보기"
                            onClick={() => {
                              if (report.img_url) {
                                openImagePreview(report.img_url);
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
                        {formatCreatedAt(report.created_at)}
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
                                kind: "report",
                                id: report.id,
                                label: `${report.type} · ${authorLabel(report)}`,
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
                                kind: "report",
                                id: report.id,
                                label: `${report.type} · ${authorLabel(report)}`,
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
            setReportFilters({ page: Math.max(1, filters.page - 1) })
          }
          onNext={() => setReportFilters({ page: filters.page + 1 })}
          disableNext={reports.length < filters.limit}
        />
      </div>
    </div>
  );
}
