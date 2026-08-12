// 담당: 지도표시팀
import { create } from "zustand";
import type {
  GridBoundsQuery,
  GridDetail,
  GridItem,
  InfraType,
  InfrastructureItem,
  CityEventItem,
  ReportItem,
  AccidentZoneItem,
  AccidentZoneType,
} from "@/lib/api/types";
import {
  SAFETY_GRADES,
  type SafetyGrade,
} from "@/app/map/gridStyle";

export type MapBounds = GridBoundsQuery;
export type { SafetyGrade };

/** 인프라 타입 전체 (주변 토글 기본값) */
export const INFRA_TYPES: InfraType[] = [
  "CCTV",
  "경찰서",
  "소방서",
  "편의점",
];

/** 사고다발 타입 전체 (다발 토글 기본값) */
export const ACCIDENT_ZONE_TYPES: AccidentZoneType[] = [
  "pedestrian",
  "bicycle",
  "motorcycle",
  "schoolzone",
];

export const ACCIDENT_ZONE_LABEL: Record<AccidentZoneType, string> = {
  pedestrian: "보행자",
  bicycle: "자전거",
  motorcycle: "이륜차",
  schoolzone: "어린이보호구역",
};

/** 왼쪽 사이드 패널 레이아웃 (Panel ↔ MapControls 동기) */
export const SIDE_RAIL_WIDTH = 48;
export const SIDE_DETAIL_WIDTH = 360;
export const SIDE_PANEL_GAP = 20;
export const SIDE_PANEL_SLIDE_MS = 250;

type MapActions = {
  moveTo: (lat: number, lng: number, level?: number) => void;
  searchAddress: (query: string) => void;
  moveToCurrentLocation: () => void;
};

type MapState = {
  bounds: MapBounds | null;
  grids: GridItem[];
  gridsLoading: boolean;

  selectedGridId: number | null;
  infrastructures: InfrastructureItem[];

  /** 지도에 사고다발 폴리곤 표시 */
  accidentZonesVisible: boolean;
  /** 표시할 다발 타입 (비어 있으면 폴리곤 없음) */
  visibleAccidentTypes: AccidentZoneType[];
  accidentZones: AccidentZoneItem[];
  setAccidentZonesVisible: (visible: boolean) => void;
  toggleVisibleAccidentType: (type: AccidentZoneType) => void;
  setAccidentZones: (items: AccidentZoneItem[]) => void;


  /** 지도에 인프라 마커 표시 */
  infraVisible: boolean;
  /** 표시할 인프라 타입 (비어 있으면 마커 없음) */
  visibleInfraTypes: InfraType[];
  setInfraVisible: (visible: boolean) => void;
  toggleVisibleInfraType: (type: InfraType) => void;

  /** 지도에 격자 폴리곤 표시 */
  gridsVisible: boolean;
  /** 표시할 안전등급 (비어 있으면 아무것도 안 그림) */
  visibleGrades: SafetyGrade[];
  setGridsVisible: (visible: boolean) => void;
  toggleVisibleGrade: (grade: SafetyGrade) => void;

  gridDetail: GridDetail | null;
  detailLoading: boolean;

  /** 왼쪽 상세 패널 열림 (MapControls left와 동기) */
  sidePanelOpen: boolean;
  setSidePanelOpen: (open: boolean) => void;
  /** 왼쪽 패널 탭 (레일 / 지도 클릭 공유) */
  sidePanelTab: "grid" | "events" | "reports" | "mypage";
  setSidePanelTab: (tab: "grid" | "events" | "reports" | "mypage") => void;

  setBounds: (bounds: MapBounds) => void;
  setGrids: (grids: GridItem[]) => void;
  setGridsLoading: (loading: boolean) => void;
  setSelectedGridId: (id: number | null) => void;
  setInfrastructures: (items: InfrastructureItem[]) => void;
  setGridDetail: (detail: GridDetail | null) => void;
  setDetailLoading: (loading: boolean) => void;
  clearSelection: () => void;
  //events
  cityEvents: CityEventItem[];
  cityEventsLoading: boolean;
  selectedEventId: number | null;
  setCityEvents: (items: CityEventItem[]) => void;
  setCityEventsLoading: (loading: boolean) => void;
  setSelectedEventId: (id: number | null) => void;
  //reports
  
  reports: ReportItem[];
  reportsLoading: boolean;
  setReports: (items: ReportItem[]) => void;
  setReportsLoading: (loading: boolean) => void;
  selectedReportId: number | null;
  setSelectedReportId: (id: number | null) => void;
  //map action
  moveTo: MapActions["moveTo"] | null;
  searchAddress: MapActions["searchAddress"] | null;
  moveToCurrentLocation: MapActions["moveToCurrentLocation"] | null;
  setMapActions: (actions: MapActions) => void;
  clearMapActions: () => void;

};

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  grids: [],
  gridsLoading: false,

  selectedGridId: null,
  infrastructures: [],

  infraVisible: true,
  visibleInfraTypes: [...INFRA_TYPES],
  setInfraVisible: (infraVisible) => set({ infraVisible }),
  toggleVisibleInfraType: (type) =>
    set((s) => ({
      visibleInfraTypes: s.visibleInfraTypes.includes(type)
        ? s.visibleInfraTypes.filter((t) => t !== type)
        : [...s.visibleInfraTypes, type],
    })),
  accidentZonesVisible: false,
  visibleAccidentTypes: [...ACCIDENT_ZONE_TYPES],
  accidentZones: [],
  setAccidentZonesVisible: (accidentZonesVisible) =>
    set({ accidentZonesVisible }),
  toggleVisibleAccidentType: (type) =>
    set((s) => ({
      visibleAccidentTypes: s.visibleAccidentTypes.includes(type)
        ? s.visibleAccidentTypes.filter((t) => t !== type)
        : [...s.visibleAccidentTypes, type],
    })),
  setAccidentZones: (accidentZones) => set({ accidentZones }),
  gridsVisible: true,
  visibleGrades: [...SAFETY_GRADES],
  setGridsVisible: (gridsVisible) => set({ gridsVisible }),
  toggleVisibleGrade: (grade) =>
    set((s) => ({
      visibleGrades: s.visibleGrades.includes(grade)
        ? s.visibleGrades.filter((g) => g !== grade)
        : [...s.visibleGrades, grade],
    })),

  gridDetail: null,
  detailLoading: false,

  sidePanelOpen: false,
  setSidePanelOpen: (sidePanelOpen) => set({ sidePanelOpen }),
  sidePanelTab: "events",
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
  selectedReportId: null,
  setSelectedReportId: (selectedReportId) => set({ selectedReportId }),



  cityEvents: [],
  cityEventsLoading: false,
  selectedEventId: null,

  setBounds: (bounds) => set({ bounds }),
  setGrids: (grids) => set({ grids }),
  setGridsLoading: (gridsLoading) => set({ gridsLoading }),
  setSelectedGridId: (selectedGridId) => set({ selectedGridId }),
  setInfrastructures: (infrastructures) => set({ infrastructures }),
  setGridDetail: (gridDetail) => set({ gridDetail }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setCityEvents: (cityEvents) => set({ cityEvents }),
  setCityEventsLoading: (cityEventsLoading) => set({ cityEventsLoading }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  clearSelection: () =>
    set({ selectedGridId: null, gridDetail: null }),
  // infrastructures는 지도 view(중심+반경)용 — 격자 선택 해제와 무관

  reports: [],
  reportsLoading: false,
  setReports: (reports) => set({ reports }),
  setReportsLoading: (reportsLoading) => set({ reportsLoading }),

  //map action
  moveTo: null,
  searchAddress: null,
  moveToCurrentLocation: null,
  setMapActions: (actions) =>
    set({
      moveTo: actions.moveTo,
      searchAddress: actions.searchAddress,
      moveToCurrentLocation: actions.moveToCurrentLocation,
    }),
  clearMapActions: () =>
    set({
      moveTo: null,
      searchAddress: null,
      moveToCurrentLocation: null,
    }),

}));
