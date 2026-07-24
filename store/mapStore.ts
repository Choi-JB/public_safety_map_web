// 담당: 지도표시팀
import { create } from "zustand";
import type { GridBoundsQuery, GridItem } from "@/lib/api/types";

export type MapBounds = GridBoundsQuery;

type MapState = {
  bounds: MapBounds | null;
  grids: GridItem[];
  gridsLoading: boolean;
  setBounds: (bounds: MapBounds) => void;
  setGrids: (grids: GridItem[]) => void;
  setGridsLoading: (loading: boolean) => void;
};

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  grids: [],
  gridsLoading: false,
  setBounds: (bounds) => set({ bounds }),
  setGrids: (grids) => set({ grids }),
  setGridsLoading: (gridsLoading) => set({ gridsLoading }),
}));