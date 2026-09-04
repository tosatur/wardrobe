import { create } from "zustand";
import type { OutfitItemDto } from "@wardrobe/shared";

export type CanvasPlacement = {
  itemId: string;
  x: number;
  y: number;
  zIndex: number;
  nickname: string | null;
  categoryName: string;
  photoCutoutUrl: string | null;
};

type PaletteItem = {
  id: string;
  nickname: string | null;
  categoryName: string;
  photoCutoutUrl: string | null;
};

type OutfitCanvasStore = {
  placements: CanvasPlacement[];
  nextZIndex: number;
  addPlacement: (item: PaletteItem, x: number, y: number) => void;
  movePlacement: (itemId: string, x: number, y: number) => void;
  bringToFront: (itemId: string) => void;
  removePlacement: (itemId: string) => void;
  loadPlacements: (items: OutfitItemDto[]) => void;
  reset: () => void;
};

export const useOutfitCanvasStore = create<OutfitCanvasStore>((set) => ({
  placements: [],
  nextZIndex: 1,

  addPlacement: (item, x, y) =>
    set((state) => {
      if (state.placements.some((p) => p.itemId === item.id)) return state;
      return {
        placements: [
          ...state.placements,
          {
            itemId: item.id,
            x,
            y,
            zIndex: state.nextZIndex,
            nickname: item.nickname,
            categoryName: item.categoryName,
            photoCutoutUrl: item.photoCutoutUrl,
          },
        ],
        nextZIndex: state.nextZIndex + 1,
      };
    }),

  movePlacement: (itemId, x, y) =>
    set((state) => ({
      placements: state.placements.map((p) => (p.itemId === itemId ? { ...p, x, y } : p)),
    })),

  bringToFront: (itemId) =>
    set((state) => ({
      placements: state.placements.map((p) =>
        p.itemId === itemId ? { ...p, zIndex: state.nextZIndex } : p,
      ),
      nextZIndex: state.nextZIndex + 1,
    })),

  removePlacement: (itemId) =>
    set((state) => ({ placements: state.placements.filter((p) => p.itemId !== itemId) })),

  loadPlacements: (items) =>
    set({
      placements: items.map((oi) => ({
        itemId: oi.itemId,
        x: oi.x,
        y: oi.y,
        zIndex: oi.zIndex,
        nickname: oi.item.nickname,
        categoryName: oi.item.categoryName,
        photoCutoutUrl: oi.item.photoCutoutUrl,
      })),
      nextZIndex: Math.max(0, ...items.map((oi) => oi.zIndex)) + 1,
    }),

  reset: () => set({ placements: [], nextZIndex: 1 }),
}));
