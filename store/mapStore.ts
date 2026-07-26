// 담당: 지도표시팀
import { create } from "zustand";
import type {
  GridBoundsQuery,
  GridDetail,
  GridItem,
  InfraType,
  InfrastructureItem,
} from "@/lib/api/types";

export type MapBounds = GridBoundsQuery;

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

  setBounds: (bounds) => set({ bounds }),
  setGrids: (grids) => set({ grids }),
  setGridsLoading: (gridsLoading) => set({ gridsLoading }),
  setSelectedGridId: (selectedGridId) => set({ selectedGridId }),
  setInfraType: (infraType) => set({ infraType }),
  setInfrastructures: (infrastructures) => set({ infrastructures }),
  setGridDetail: (gridDetail) => set({ gridDetail }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  clearSelection: () =>
    set({ selectedGridId: null, infrastructures: [], gridDetail: null }),
}));