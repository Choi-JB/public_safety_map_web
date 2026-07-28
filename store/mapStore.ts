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
} from "@/lib/api/types";

export type MapBounds = GridBoundsQuery;

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
  infraType: InfraType | null; // null = 전체
  infrastructures: InfrastructureItem[];

  gridDetail: GridDetail | null;
  detailLoading: boolean;


  setBounds: (bounds: MapBounds) => void;
  setGrids: (grids: GridItem[]) => void;
  setGridsLoading: (loading: boolean) => void;
  setSelectedGridId: (id: number | null) => void;
  setInfraType: (type: InfraType | null) => void;
  setInfrastructures: (items: InfrastructureItem[]) => void;
  setGridDetail: (detail: GridDetail | null) => void;
  setDetailLoading: (loading: boolean) => void;
  clearSelection: () => void;
  //events
  cityEvents: CityEventItem[];
  cityEventsLoading: boolean;
  setCityEvents: (items: CityEventItem[]) => void;
  setCityEventsLoading: (loading: boolean) => void;
  //reports
  reports: ReportItem[];
  reportsLoading: boolean;
  setReports: (items: ReportItem[]) => void;
  setReportsLoading: (loading: boolean) => void;
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
  infraType: null,
  infrastructures: [],

  gridDetail: null,
  detailLoading: false,

  cityEvents: [],
  cityEventsLoading: false,

  
  setBounds: (bounds) => set({ bounds }),
  setGrids: (grids) => set({ grids }),
  setGridsLoading: (gridsLoading) => set({ gridsLoading }),
  setSelectedGridId: (selectedGridId) => set({ selectedGridId }),
  setInfraType: (infraType) => set({ infraType }),
  setInfrastructures: (infrastructures) => set({ infrastructures }),
  setGridDetail: (gridDetail) => set({ gridDetail }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setCityEvents: (cityEvents) => set({ cityEvents }),
  setCityEventsLoading: (cityEventsLoading) => set({ cityEventsLoading }),
  clearSelection: () =>
    set({ selectedGridId: null, infrastructures: [], gridDetail: null }),

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
