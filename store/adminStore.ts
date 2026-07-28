// 담당: 피드백/관리자팀
import { create } from "zustand";
import {
  createEvent,
  deleteEvent,
  deleteFeedback,
  deleteReport,
  fetchEvents,
  fetchFeedbacks,
  fetchReports,
  fetchSummary,
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
  DatePreset,
  DeleteTarget,
  MapFocus,
  UpdateEventPayload,
} from "@/lib/api/admin";

type ReportFilters = {
  type: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  page: number;
  limit: number;
};

type FeedbackFilters = {
  safety_feeling: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  keyword: string;
  page: number;
  limit: number;
};

type EventFilters = {
  type: string;
  filter: ActiveFilter;
  date_preset: DatePreset;
  date_from: string;
  date_to: string;
  page: number;
  limit: number;
};

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
  submitCityEvent: (payload: CreateEventPayload) => Promise<void>;
  updateCityEvent: (payload: UpdateEventPayload) => Promise<boolean>;
};

const initialDateRange = getDateRangeFromPreset("1m");

const defaultReportFilters: ReportFilters = {
  type: "",
  filter: "active",
  date_preset: "1m",
  date_from: initialDateRange.date_from,
  date_to: initialDateRange.date_to,
  page: 1,
  limit: 10,
};

const defaultFeedbackFilters: FeedbackFilters = {
  safety_feeling: "",
  filter: "active",
  date_preset: "1m",
  date_from: initialDateRange.date_from,
  date_to: initialDateRange.date_to,
  keyword: "",
  page: 1,
  limit: 10,
};

const defaultEventFilters: EventFilters = {
  type: "",
  filter: "active",
  date_preset: "1m",
  date_from: initialDateRange.date_from,
  date_to: initialDateRange.date_to,
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
    const range = getDateRangeFromPreset(preset);
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
        keyword: "",
        page: 1,
        limit: 10,
      },
    });
  },
  resetEventFilters: () => {
    const range = getDateRangeFromPreset("1m");
    set({
      eventFilters: {
        type: "",
        filter: "active",
        date_preset: "1m",
        date_from: range.date_from,
        date_to: range.date_to,
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
      const { reports, types } = await fetchReports({
        page: reportFilters.page,
        limit: reportFilters.limit,
        filter: reportFilters.filter,
        date_from: `${reportFilters.date_from} 00:00:00.000` || undefined,
        date_to: `${reportFilters.date_to} 23:59:59.999` || undefined,
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
      const feedbacks = await fetchFeedbacks({
        page: feedbackFilters.page,
        limit: feedbackFilters.limit,
        filter: feedbackFilters.filter,
        date_from: feedbackFilters.date_from || undefined,
        date_to: feedbackFilters.date_to || undefined,
      });
      const filtered = feedbacks.filter((f) => {
        if (
          feedbackFilters.safety_feeling &&
          f.safety_feeling !== feedbackFilters.safety_feeling
        ) {
          return false;
        }
        if (feedbackFilters.keyword) {
          const q = feedbackFilters.keyword.toLowerCase();
          const hay = `${f.comment} ${f.user?.nickname ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
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
      const { events, types } = await fetchEvents({
        page: eventFilters.page,
        limit: eventFilters.limit,
        filter: eventFilters.filter,
        date_from: eventFilters.date_from || undefined,
        date_to: eventFilters.date_to || undefined,
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
          message: "도시정보가 삭제되었습니다.",
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
