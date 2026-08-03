// 담당: 피드백/관리자팀
import { create } from "zustand";
import {
  createEvent,
  createReport,
  deleteEvent,
  deleteFeedback,
  deleteReport,
  fetchEvents,
  fetchFeedbacks,
  fetchReports,
  fetchSummary,
  restoreReport,
  restoreEvent,
  updateEvent,
} from "@/lib/api/admin";
import type {
  ActiveFilter,
  AdminCityEvent,
  AdminFeedback,
  AdminReport,
  AdminSummary,
  AdminTab,
  CreateEventPayload,
  CreateReportPayload,
  DatePreset,
  DeleteTarget,
  EventScheduleStatus,
  MapFocus,
  RestoreTarget,
  UpdateEventPayload,
} from "@/lib/api/admin";

type ReportFilters = {
  type: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  search_mode: "user" | "keyword";
  search_query: string;
  page: number;
  limit: number;
};

type FeedbackFilters = {
  safety_feeling: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  search_mode: "user" | "keyword";
  search_query: string;
  page: number;
  limit: number;
};

type EventFilters = {
  type: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  keyword: string;
  status: EventScheduleStatus | "";
  page: number;
  limit: number;
};

function resolveListSearchParams(
  mode: "user" | "keyword",
  query: string,
): { nickname?: string; keyword?: string } {
  const q = query.trim();
  if (!q) return {};
  if (mode === "user") return { nickname: q };
  return { keyword: q };
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDateRangeFromPreset(preset: Exclude<DatePreset, "">) {
  const to = new Date();
  const from = new Date();
  if (preset === "1y") from.setFullYear(from.getFullYear() - 1);
  if (preset === "6m") from.setMonth(from.getMonth() - 6);
  if (preset === "3m") from.setMonth(from.getMonth() - 3);
  if (preset === "1m") from.setMonth(from.getMonth() - 1);
  return {
    date_from: toDateInputValue(from),
    date_to: toDateInputValue(to),
  };
}

/** 도시정보용: 이번 주(월~일) / 이번 달 / 올해 */
export function getEventDateRangeFromPreset(
  preset: Exclude<DatePreset, "">,
) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (preset === "this_week") {
    const day = now.getDay(); // 0=일 … 6=토
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const from = new Date(y, m, d + mondayOffset);
    const to = new Date(y, m, d + mondayOffset + 6);
    return {
      date_from: toDateInputValue(from),
      date_to: toDateInputValue(to),
    };
  }

  if (preset === "this_month") {
    return {
      date_from: toDateInputValue(new Date(y, m, 1)),
      date_to: toDateInputValue(new Date(y, m + 1, 0)),
    };
  }

  if (preset === "this_year") {
    return {
      date_from: toDateInputValue(new Date(y, 0, 1)),
      date_to: toDateInputValue(new Date(y, 11, 31)),
    };
  }

  // fallback: 과거 프리셋과 동일하게 오늘까지
  return getDateRangeFromPreset(preset);
}

/** 년·월로 조회 범위 설정 (시작=해당 월 1일, 종료=해당 월 말일) */
export function getDateRangeFromYearMonth(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
) {
  return {
    date_from: toDateInputValue(new Date(fromYear, fromMonth - 1, 1)),
    date_to: toDateInputValue(new Date(toYear, toMonth, 0)),
  };
}

/** "전체"는 옵션 UI에서 맨 위, "기타"는 목록 맨 아래 */
function sortTypesWithEtcLast(types: string[]) {
  const unique = Array.from(new Set(types.filter(Boolean)));
  const rest = unique
    .filter((type) => type !== "기타")
    .sort((a, b) => a.localeCompare(b, "ko"));
  return unique.includes("기타") ? [...rest, "기타"] : rest;
}

type AdminState = {
  tab: AdminTab;
  summary: AdminSummary | null;
  reports: AdminReport[];
  reportTypes: string[];
  feedbacks: AdminFeedback[];
  feedbackSafetyFeelings: string[];
  events: AdminCityEvent[];
  eventTypes: string[];
  reportFilters: ReportFilters;
  feedbackFilters: FeedbackFilters;
  eventFilters: EventFilters;
  mapFocus: MapFocus | null;
  selectedReport: AdminReport | null;
  selectedFeedback: AdminFeedback | null;
  selectedEvent: AdminCityEvent | null;
  previewImageUrl: string | null;
  deleteTarget: DeleteTarget | null;
  restoreTarget: RestoreTarget | null;
  loading: boolean;
  error: string | null;
  message: string | null;

  setTab: (tab: AdminTab) => void;
  setMapFocus: (focus: MapFocus | null) => void;
  setReportFilters: (patch: Partial<ReportFilters>) => void;
  applyReportDatePreset: (preset: DatePreset) => void;
  setFeedbackFilters: (patch: Partial<FeedbackFilters>) => void;
  applyFeedbackDatePreset: (preset: DatePreset) => void;
  setEventFilters: (patch: Partial<EventFilters>) => void;
  openReportDetail: (report: AdminReport | null) => void;
  openFeedbackDetail: (feedback: AdminFeedback | null) => void;
  openEventDetail: (event: AdminCityEvent | null) => void;
  openImagePreview: (url: string | null) => void;
  openDeleteConfirm: (target: DeleteTarget | null) => void;
  openRestoreConfirm: (target: RestoreTarget | null) => void;
  clearNotice: () => void;
  resetReportFilters: () => void;
  resetFeedbackFilters: () => void;
  resetEventFilters: () => void;
  applyEventDatePreset: (preset: DatePreset) => void;

  loadSummary: () => Promise<void>;
  loadReports: () => Promise<void>;
  loadFeedbacks: () => Promise<void>;
  loadEvents: () => Promise<void>;
  confirmDelete: () => Promise<void>;
  confirmRestore: () => Promise<void>;
  restoreReportById: (id: string | number) => Promise<void>;
  restoreEventById: (id: string | number) => Promise<void>;
  submitReport: (payload: CreateReportPayload) => Promise<boolean>;
  submitCityEvent: (payload: CreateEventPayload) => Promise<void>;
  updateCityEvent: (payload: UpdateEventPayload) => Promise<boolean>;
};

const initialDateRange = getDateRangeFromPreset("1m");
const initialEventDateRange = getEventDateRangeFromPreset("this_month");

const defaultReportFilters: ReportFilters = {
  type: "",
  filter: "active",
  date_preset: "1m",
  date_from: initialDateRange.date_from,
  date_to: initialDateRange.date_to,
  search_mode: "keyword",
  search_query: "",
  page: 1,
  limit: 10,
};

const defaultFeedbackFilters: FeedbackFilters = {
  safety_feeling: "",
  filter: "active",
  date_preset: "1m",
  date_from: initialDateRange.date_from,
  date_to: initialDateRange.date_to,
  search_mode: "keyword",
  search_query: "",
  page: 1,
  limit: 10,
};

const defaultEventFilters: EventFilters = {
  type: "",
  filter: "active",
  date_preset: "this_month",
  date_from: initialEventDateRange.date_from,
  date_to: initialEventDateRange.date_to,
  keyword: "",
  status: "",
  page: 1,
  limit: 10,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  tab: "dashboard",
  summary: null,
  reports: [],
  reportTypes: [],
  feedbacks: [],
  feedbackSafetyFeelings: [],
  events: [],
  eventTypes: [],
  reportFilters: defaultReportFilters,
  feedbackFilters: defaultFeedbackFilters,
  eventFilters: defaultEventFilters,
  mapFocus: null,
  selectedReport: null,
  selectedFeedback: null,
  selectedEvent: null,
  previewImageUrl: null,
  deleteTarget: null,
  restoreTarget: null,
  loading: false,
  error: null,
  message: null,

  setTab: (tab) => set({ tab, error: null, message: null }),
  setMapFocus: (mapFocus) => set({ mapFocus }),
  setReportFilters: (patch) =>
    set((s) => ({ reportFilters: { ...s.reportFilters, ...patch } })),
  applyReportDatePreset: (preset) => {
    if (!preset) {
      set((s) => ({
        reportFilters: { ...s.reportFilters, date_preset: "" },
      }));
      return;
    }
    const range = getDateRangeFromPreset(preset);
    set((s) => ({
      reportFilters: {
        ...s.reportFilters,
        date_preset: preset,
        date_from: range.date_from,
        date_to: range.date_to,
        page: 1,
      },
    }));
  },
  setFeedbackFilters: (patch) =>
    set((s) => ({ feedbackFilters: { ...s.feedbackFilters, ...patch } })),
  applyFeedbackDatePreset: (preset) => {
    if (!preset) {
      set((s) => ({
        feedbackFilters: { ...s.feedbackFilters, date_preset: "" },
      }));
      return;
    }
    const range = getDateRangeFromPreset(preset);
    set((s) => ({
      feedbackFilters: {
        ...s.feedbackFilters,
        date_preset: preset,
        date_from: range.date_from,
        date_to: range.date_to,
        page: 1,
      },
    }));
  },
  setEventFilters: (patch) =>
    set((s) => ({ eventFilters: { ...s.eventFilters, ...patch } })),
  applyEventDatePreset: (preset) => {
    if (!preset) {
      set((s) => ({
        eventFilters: { ...s.eventFilters, date_preset: "" },
      }));
      return;
    }
    const range = getEventDateRangeFromPreset(preset);
    set((s) => ({
      eventFilters: {
        ...s.eventFilters,
        date_preset: preset,
        date_from: range.date_from,
        date_to: range.date_to,
        page: 1,
      },
    }));
  },
  openReportDetail: (selectedReport) => set({ selectedReport }),
  openFeedbackDetail: (selectedFeedback) => set({ selectedFeedback }),
  openEventDetail: (selectedEvent) => set({ selectedEvent }),
  openImagePreview: (previewImageUrl) => set({ previewImageUrl }),
  openDeleteConfirm: (deleteTarget) => set({ deleteTarget }),
  openRestoreConfirm: (restoreTarget) => set({ restoreTarget }),
  clearNotice: () => set({ error: null, message: null }),
  resetReportFilters: () => {
    const range = getDateRangeFromPreset("1m");
    set({
      reportFilters: {
        type: "",
        filter: "active",
        date_preset: "1m",
        date_from: range.date_from,
        date_to: range.date_to,
        search_mode: "keyword",
        search_query: "",
        page: 1,
        limit: 10,
      },
    });
  },
  resetFeedbackFilters: () => {
    const range = getDateRangeFromPreset("1m");
    set({
      feedbackFilters: {
        safety_feeling: "",
        filter: "active",
        date_preset: "1m",
        date_from: range.date_from,
        date_to: range.date_to,
        search_mode: "keyword",
        search_query: "",
        page: 1,
        limit: 10,
      },
    });
  },
  resetEventFilters: () => {
    const range = getEventDateRangeFromPreset("this_month");
    set({
      eventFilters: {
        type: "",
        filter: "active",
        date_preset: "this_month",
        date_from: range.date_from,
        date_to: range.date_to,
        keyword: "",
        status: "",
        page: 1,
        limit: 10,
      },
    });
  },

  loadSummary: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await fetchSummary();
      set({ summary, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "요약 조회 실패",
      });
    }
  },

  loadReports: async () => {
    const { reportFilters } = get();
    set({ loading: true, error: null });
    try {
      const search = resolveListSearchParams(
        reportFilters.search_mode,
        reportFilters.search_query,
      );
      const { reports, types } = await fetchReports({
        page: reportFilters.page,
        limit: reportFilters.limit,
        filter: reportFilters.filter,
        date_from: `${reportFilters.date_from} 00:00:00.000` || undefined,
        date_to: `${reportFilters.date_to} 23:59:59.999` || undefined,
        ...search,
      });
      const filtered = reportFilters.type
        ? reports.filter((r) => r.type === reportFilters.type)
        : reports;
      set({
        reports: filtered,
        reportTypes: sortTypesWithEtcLast(types),
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "제보 목록 조회 실패",
      });
    }
  },

  loadFeedbacks: async () => {
    const { feedbackFilters, feedbackSafetyFeelings } = get();
    set({ loading: true, error: null });
    try {
      const search = resolveListSearchParams(
        feedbackFilters.search_mode,
        feedbackFilters.search_query,
      );
      const feedbacks = await fetchFeedbacks({
        page: feedbackFilters.page,
        limit: feedbackFilters.limit,
        filter: feedbackFilters.filter,
        date_from: feedbackFilters.date_from || undefined,
        date_to: feedbackFilters.date_to || undefined,
        ...search,
      });
      const filtered = feedbacks.filter((f) => {
        if (
          feedbackFilters.safety_feeling &&
          f.safety_feeling !== feedbackFilters.safety_feeling
        ) {
          return false;
        }
        return true;
      });
      // 백엔드에 types 필드가 없어, 조회된 데이터에서 체감안전도를 누적
      const nextFeelings = Array.from(
        new Set([
          ...feedbackSafetyFeelings,
          ...feedbacks.map((f) => f.safety_feeling).filter(Boolean),
        ]),
      ).sort();
      set({
        feedbacks: filtered,
        feedbackSafetyFeelings: nextFeelings,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "피드백 목록 조회 실패",
      });
    }
  },

  loadEvents: async () => {
    const { eventFilters } = get();
    set({ loading: true, error: null });
    try {
      const keyword = eventFilters.keyword.trim() || undefined;
      const { events, types } = await fetchEvents({
        page: eventFilters.page,
        limit: eventFilters.limit,
        filter: eventFilters.filter,
        date_from: eventFilters.date_from || undefined,
        date_to: eventFilters.date_to || undefined,
        keyword,
        status: eventFilters.status || undefined,
      });
      const filtered = eventFilters.type
        ? events.filter((e) => e.type === eventFilters.type)
        : events;
      const selectedId = get().selectedEvent?.id;
      set({
        events: filtered,
        eventTypes: types,
        selectedEvent: selectedId
          ? (filtered.find((e) => e.id === selectedId) ??
            events.find((e) => e.id === selectedId) ??
            null)
          : get().selectedEvent,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "도시정보 목록 조회 실패",
      });
    }
  },

  confirmDelete: async () => {
    const { deleteTarget } = get();
    if (!deleteTarget) return;
    set({ loading: true, error: null });
    try {
      const id = Number(deleteTarget.id);
      if (deleteTarget.kind === "report") {
        await deleteReport(id);
        set({
          deleteTarget: null,
          selectedReport: null,
          message: "제보가 비활성 처리되었습니다.",
          loading: false,
        });
        await get().loadReports();
        await get().loadSummary();
      } else if (deleteTarget.kind === "feedback") {
        await deleteFeedback(id);
        set({
          deleteTarget: null,
          selectedFeedback: null,
          message: "피드백이 비활성 처리되었습니다.",
          loading: false,
        });
        await get().loadFeedbacks();
        await get().loadSummary();
      } else {
        await deleteEvent(id);
        set({
          deleteTarget: null,
          selectedEvent: null,
          message: "도시정보가 비활성 처리되었습니다.",
          loading: false,
        });
        await get().loadEvents();
        await get().loadSummary();
      }
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "삭제에 실패했습니다.",
      });
    }
  },

  restoreReportById: async (id) => {
    set({ loading: true, error: null });
    try {
      await restoreReport(Number(id));
      set({
        loading: false,
        restoreTarget: null,
        message: "제보가 복구되었습니다.",
      });
      await get().loadReports();
      await get().loadSummary();
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "복구에 실패했습니다.",
      });
    }
  },

  restoreEventById: async (id) => {
    set({ loading: true, error: null });
    try {
      await restoreEvent(Number(id));
      set({
        loading: false,
        restoreTarget: null,
        message: "도시정보가 복구되었습니다.",
      });
      await get().loadEvents();
      await get().loadSummary();
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "복구에 실패했습니다.",
      });
    }
  },

  confirmRestore: async () => {
    const { restoreTarget } = get();
    if (!restoreTarget) return;
    if (restoreTarget.kind === "report") {
      await get().restoreReportById(restoreTarget.id);
    } else {
      await get().restoreEventById(restoreTarget.id);
    }
  },

  submitReport: async (payload) => {
    set({ loading: true, error: null });
    try {
      await createReport(payload);
      set({
        loading: false,
        message: "제보가 등록되었습니다.",
        tab: "reports",
      });
      await get().loadReports();
      await get().loadSummary();
      return true;
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "제보 등록에 실패했습니다.",
      });
      return false;
    }
  },

  submitCityEvent: async (payload) => {
    set({ loading: true, error: null });
    try {
      await createEvent(payload);
      set({
        loading: false,
        message: "도시정보가 등록되었습니다.",
        tab: "city-events",
      });
      await get().loadEvents();
      await get().loadSummary();
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "등록에 실패했습니다.",
      });
    }
  },

  updateCityEvent: async (payload) => {
    set({ loading: true, error: null });
    try {
      await updateEvent(payload);
      set({
        loading: false,
        message: "도시정보가 수정되었습니다.",
      });
      await get().loadEvents();
      await get().loadSummary();
      return true;
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "수정에 실패했습니다.",
      });
      return false;
    }
  },
}));
