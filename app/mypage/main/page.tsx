// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  fetchMyPageReports,
  fetchMyPageSummary,
  type MyReport,
} from "@/lib/api/mypage";
import { useAuthStore } from "@/store/authStore";
import { useMapStore } from "@/store/mapStore";

const PAGE_SIZE = 10;

const cardStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  marginBottom: 8,
  border: "1px solid #e5e7eb",
  borderRadius: "12px 24px 24px 12px",
  padding: 10,
  background: "#fff",
  boxSizing: "border-box",
};

type View = "summary" | "reports";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyPageMain({ onSelectReport }: { onSelectReport: (r: {id: number, lat: number | null, lng: number | null}) => void }) {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [reportCount, setReportCount] = useState<number | null>(null);
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReportId = useMapStore((s) => s.selectedReportId);

  const [view, setView] = useState<View>("summary");
  const [reports, setReports] = useState<MyReport[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);


  useEffect(() => {
    if (userId == null) {
      setReportCount(null);
      setFeedbackCount(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchMyPageSummary(userId)
      .then((data) => {
        if (cancelled) return;
        setReportCount(data.reportCount ?? 0);
        setFeedbackCount(data.feedbackCount ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "마이페이지 정보를 불러오지 못했습니다.",
        );
        setReportCount(null);
        setFeedbackCount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function loadReports(nextPage: number, append: boolean) {
    if (userId == null) return;

    setListLoading(true);
    setListError(null);
    try {
      const items = await fetchMyPageReports(userId, nextPage, PAGE_SIZE);
      setReports((prev) => (append ? [...prev, ...items] : items));
      setPage(nextPage);
      setHasMore(items.length >= PAGE_SIZE);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "제보 목록을 불러오지 못했습니다.",
      );
      if (!append) {
        setReports([]);
        setHasMore(false);
      }
    } finally {
      setListLoading(false);
    }
  }

  function openReports() {
    setView("reports");
    setReports([]);
    setPage(1);
    setHasMore(false);
    void loadReports(1, false);
  }

  if (userId == null) {
    return (
      <div style={{ fontSize: 12, color: "#666" }}>
        로그인 후 확인할 수 있습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontSize: 12, color: "#666" }}>불러오는 중...</div>
    );
  }

  if (error) {
    return <div style={{ fontSize: 12, color: "#b91c1c" }}>{error}</div>;
  }

  if (view === "reports") {
    return (
      <>
        <button
          type="button"
          onClick={() => setView("summary")}
          style={{
            marginBottom: 10,
            padding: 0,
            border: "none",
            background: "none",
            color: "#2f5d7c",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← 뒤로
        </button>

        {listLoading && reports.length === 0 && (
          <div style={{ fontSize: 12, color: "#666" }}>제보 불러오는 중...</div>
        )}
        {listError && (
          <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 8 }}>
            {listError}
          </div>
        )}
        {!listLoading && !listError && reports.length === 0 && (
          <div style={{ fontSize: 12, color: "#666" }}>제보한 내용이 없습니다.</div>
        )}

        {reports.map((r) => {
            const selected = Number(r.id) === selectedReportId;
            return (
            <button
            key={r.id}
            type="button"
            onClick={() =>
              onSelectReport({
                id: Number(r.id),
                lat: r.lat ?? null,
                lng: r.lng ?? null,
              })
            }
            style={{ ...cardStyle, cursor: "pointer", background: selected ? "#fef2f2" : "#fff", border: selected ? "2px solid #dc2626" : "1px solid #e5e7eb" }}
          >
         
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {r.type ?? "제보"}
            </div>
            {r.description && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                {r.description}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
              {formatDateTime(r.created_at)}
              {r.expire_at ? `~${formatDateTime(r.expire_at)}` : ""}
            </div>
         
          </button>
        )}
        )}

        {hasMore && (
          <button
            type="button"
            disabled={listLoading}
            onClick={() => void loadReports(page + 1, true)}
            style={{
              ...cardStyle,
              cursor: listLoading ? "not-allowed" : "pointer",
              textAlign: "center",
              fontWeight: 600,
              fontSize: 13,
              color: "#374151",
              opacity: listLoading ? 0.55 : 1,
            }}
          >
            {listLoading ? "불러오는 중…" : "더보기"}
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openReports}
        style={{
          ...cardStyle,
          cursor: "pointer",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13 }}>내가 제보한 수</div>
        <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
          {reportCount ?? 0}
        </div>
      </button>
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>내가 남긴 피드백 수</div>
        <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
          {feedbackCount ?? 0}
        </div>
      </div>
    </>
  );
}
