// 담당: 피드백/관리자팀
// TODO: 공통 client.ts 구현 후 request 호출을 get/post로 교체

import type { ApiResponse } from "./types";

export type AdminTab =
  | "dashboard"
  | "reports"
  | "feedbacks"
  | "markers"
  | "city-events";

export type ActiveFilter = "active" | "inactive" | "all";

export type AdminSummary = {
  active_reports: number;
  reports_today: number;
  total_feedbacks: number;
  feedbacks_today: number;
  active_city_events: number;
};

export type AdminReport = {
  id: string;
  user_id: string;
  grid_id: string;
  type: string;
  lat: string;
  lng: string;
  description: string;
  img_url: string | null;
  is_active: "Y" | "N";
  created_at: string;
  expire_at: string;
  user?: { nickname: string } | null;
};

export type DatePreset = "" | "1y" | "6m" | "3m" | "1m";

export type ReportsListResult = {
  reports: AdminReport[];
  types: string[];
};

export type AdminFeedback = {
  id: string;
  user_id: string;
  grid_id: string;
  safety_feeling: string;
  comment: string;
  img_url: string | null;
  is_active: "Y" | "N";
  created_at: string;
  user?: { nickname: string } | null;
};

export type AdminCityEvent = {
  id: string;
  type: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  start_at: string;
  end_at: string;
  created_by: string | null;
  created_at: string;
  img_url?: string | null;
  is_active?: "Y" | "N";
  user?: { nickname: string } | null;
};

export type EventsListResult = {
  events: AdminCityEvent[];
  types: string[];
};

export type CreateEventPayload = {
  type: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  start_at: string;
  end_at: string;
};

export type UpdateEventPayload = CreateEventPayload & { id: number };

export type MapFocus = {
  lat: number;
  lng: number;
  label?: string;
  id?: string;
  kind?: "report" | "feedback" | "event";
};

export type DeleteTarget =
  | { kind: "report"; id: string; label: string }
  | { kind: "feedback"; id: string; label: string }
  | { kind: "event"; id: string; label: string };

export type ListQuery = {
  page: number;
  limit: number;
  filter: ActiveFilter;
  date_from?: string;
  date_to?: string;
  date_range?: number;
};

export const REPORT_TYPES = [
  "교통사고",
  "싱크홀",
  "공사",
  "통제",
  "기타",
] as const;

export const CITY_EVENT_TYPES = ["행사", "인파밀집", "교통통제"] as const;

export const SAFETY_FEELINGS = ["안전", "보통", "불안"] as const;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || ("success" in json && json.success === false)) {
    const message =
      "message" in json && json.message
        ? json.message
        : `요청 실패 (${res.status})`;
    throw new Error(message);
  }

  if ("data" in json) {
    return json.data as T;
  }

  return undefined as T;
}

export type AdminMe = { id: string; role: string };

/**
 * 관리자 정보 조회
 * @returns 관리자 정보
 */
export async function fetchAdminMe() {
  return request<AdminMe>("/admin/me");
}

export async function fetchSummary() {
  return request<AdminSummary>("/admin/summary");
}

export async function fetchReports(query: ListQuery): Promise<ReportsListResult> {
  const qs = buildQuery({
    page: query.page,
    limit: query.limit,
    filter: query.filter === "all" ? "all" : query.filter,
    date_from: query.date_from,
    date_to: query.date_to,
    date_range: query.date_from ? undefined : (query.date_range ?? 30),
  });

  const res = await fetch(`${getBaseUrl()}/admin/reports${qs}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  let json: (ApiResponse<AdminReport[]> & { types?: string[] }) | ApiResponse<AdminReport[]>;
  try {
    json = (await res.json()) as ApiResponse<AdminReport[]> & { types?: string[] };
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || json.success === false) {
    throw new Error(
      "message" in json && json.message
        ? json.message
        : `요청 실패 (${res.status})`,
    );
  }

  return {
    reports: "data" in json ? (json.data ?? []) : [],
    types: "types" in json && Array.isArray(json.types) ? json.types : [],
  };
}

export async function deleteReport(id: number) {
  return request<undefined>("/admin/delete-report", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function fetchFeedbacks(query: ListQuery) {
  const qs = buildQuery({
    page: query.page,
    limit: query.limit,
    filter: query.filter === "all" ? "all" : query.filter,
    date_from: query.date_from,
    date_to: query.date_to,
    date_range: query.date_from ? undefined : (query.date_range ?? 30),
  });
  return request<AdminFeedback[]>(`/admin/feedbacks${qs}`);
}

export async function deleteFeedback(id: number) {
  return request<undefined>("/admin/delete-feedback", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function fetchEvents(query: ListQuery): Promise<EventsListResult> {
  const qs = buildQuery({
    page: query.page,
    limit: query.limit,
    filter: query.filter === "all" ? "all" : query.filter,
    date_from: query.date_from,
    date_to: query.date_to,
    date_range: query.date_from ? undefined : (query.date_range ?? 30),
  });

  const res = await fetch(`${getBaseUrl()}/admin/events${qs}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  let json: ApiResponse<AdminCityEvent[]> & { types?: string[] };
  try {
    json = (await res.json()) as ApiResponse<AdminCityEvent[]> & {
      types?: string[];
    };
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || json.success === false) {
    throw new Error(
      "message" in json && json.message
        ? json.message
        : `요청 실패 (${res.status})`,
    );
  }

  return {
    events: "data" in json ? (json.data ?? []) : [],
    types: Array.isArray(json.types)
      ? json.types.filter((t): t is string => typeof t === "string" && Boolean(t))
      : [],
  };
}

export async function createEvent(payload: CreateEventPayload) {
  // 백엔드 구현 이슈: 날짜는 query도 함께 전달해야 저장됨
  const qs = buildQuery({
    start_at: payload.start_at,
    end_at: payload.end_at,
  });
  return request<undefined>(`/admin/create-event${qs}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(payload: UpdateEventPayload) {
  const qs = buildQuery({
    start_at: payload.start_at,
    end_at: payload.end_at,
  });
  return request<undefined>(`/admin/update-event${qs}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id: number) {
  return request<undefined>("/admin/delete-event", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
