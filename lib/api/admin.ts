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

/**
 * 쿼리 문자열 생성
 * @param params 쿼리 파라미터
 * @returns 쿼리 문자열
 */
function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * 요청 호출
 * @param path 요청 경로
 * @param init 요청 옵션
 * @returns 요청 결과 (JSON 파싱 결과)
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  /**
   * 응답 파싱
   * @param res 응답
   * @returns 응답 결과 (JSON 파싱 결과)
   */
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  /**
   * 응답 검증
   * @param res 응답
   * @param json 응답 결과 (JSON 파싱 결과)
   * @throws 응답 검증 실패 시 예외 발생
   */
  if (!res.ok || ("success" in json && json.success === false)) {
    const message =
      "message" in json && json.message
        ? json.message
        : `요청 실패 (${res.status})`;
    throw new Error(message);
  }

  /**
   * 응답 데이터 반환
   * @param json 응답 결과 (JSON 파싱 결과)
   * @returns 응답 데이터
   */
  if ("data" in json) {
    return json.data as T;
  }

  return undefined as T;
}

/**
 * 관리자 정보 타입
 * @param id 관리자 ID
 * @param role 관리자 역할
 */
export type AdminMe = { id: string; role: string };

/**
 * 관리자 정보 조회
 * @returns 관리자 정보
 */
export async function fetchAdminMe() {
  return request<AdminMe>("/admin/me");
}

/**
 * 관리자 요약 정보 조회
 * @returns 관리자 요약 정보 (JSON 파싱 결과)
 */
export async function fetchSummary() {
  return request<AdminSummary>("/admin/summary");
}

/**
 * 신고 목록 조회
 * @param query 조회 조건
 * @returns 신고 목록 (JSON 파싱 결과)
 */
export async function fetchReports(query: ListQuery): Promise<ReportsListResult> {
  const qs = buildQuery({
    page: query.page,
    limit: query.limit,
    filter: query.filter === "all" ? "all" : query.filter,
    date_from: query.date_from,
    date_to: query.date_to,
    date_range: query.date_from ? undefined : (query.date_range ?? 30),
  });

  /**
   * 신고 목록 조회
   * @param qs 쿼리 문자열
   * @returns 신고 목록 (JSON 파싱 결과)
   */
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

/**
 * 신고 삭제
 * @param id 신고 ID
 * @returns 신고 삭제 결과 (JSON 파싱 결과)
 */
export async function deleteReport(id: number) {
  return request<undefined>("/admin/delete-report", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

/**
 * 피드백 목록 조회
 * @param query 조회 조건
 * @returns 피드백 목록 (JSON 파싱 결과)
 */
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

/**
 * 피드백 삭제
 * @param id 피드백 ID
 * @returns 피드백 삭제 결과 (JSON 파싱 결과)
 */
export async function deleteFeedback(id: number) {
  return request<undefined>("/admin/delete-feedback", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

/**
 * 이벤트 목록 조회
 * @param query 조회 조건
 * @returns 이벤트 목록 (JSON 파싱 결과)
 */
export async function fetchEvents(query: ListQuery): Promise<EventsListResult> {
  const qs = buildQuery({
    page: query.page,
    limit: query.limit,
    filter: query.filter === "all" ? "all" : query.filter,
    date_from: query.date_from,
    date_to: query.date_to,
    date_range: query.date_from ? undefined : (query.date_range ?? 30),
  });

  /**
   * 이벤트 목록 조회
   * @param qs 쿼리 문자열
   * @returns 이벤트 목록 (JSON 파싱 결과)
   */
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

/**
 * 이벤트 생성
 * @param payload 이벤트 생성 페이로드
 * @returns 이벤트 생성 결과 (JSON 파싱 결과)
 */
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

/**
 * 이벤트 수정
 * @param payload 이벤트 수정 페이로드
 * @returns 이벤트 수정 결과 (JSON 파싱 결과)
 */
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

/**
 * 이벤트 삭제
 * @param id 이벤트 ID
 * @returns 이벤트 삭제 결과 (JSON 파싱 결과)
 */
export async function deleteEvent(id: number) {
  return request<undefined>("/admin/delete-event", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
