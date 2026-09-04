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
  // Content changes only (add/move/remove) - merely picking an item up
  // (bringToFront, fired on drag start) doesn't count, or every click on a
  // placed item would trip the unsaved-changes guard.
  isDirty: boolean;
  addPlacement: (item: PaletteItem, x: number, y: number) => void;
  movePlacement: (itemId: string, x: number, y: number) => void;
  bringToFront: (itemId: string) => void;
  removePlacement: (itemId: string) => void;
  loadPlacements: (items: OutfitItemDto[]) => void;
  /** The canvas's own "Clear all" button - a real edit, unlike `reset`. */
  clearAll: () => void;
  /** Wipes the canvas back to its pre-edit state, e.g. starting a fresh
   *  outfit - not a user edit, so it doesn't mark the canvas dirty. */
  reset: () => void;
};

export const useOutfitCanvasStore = create<OutfitCanvasStore>((set) => ({
  placements: [],
  nextZIndex: 1,
  isDirty: false,

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
        isDirty: true,
      };
    }),

  movePlacement: (itemId, x, y) =>
    set((state) => ({
      placements: state.placements.map((p) => (p.itemId === itemId ? { ...p, x, y } : p)),
      isDirty: true,
    })),

  bringToFront: (itemId) =>
    set((state) => ({
      placements: state.placements.map((p) =>
        p.itemId === itemId ? { ...p, zIndex: state.nextZIndex } : p,
      ),
      nextZIndex: state.nextZIndex + 1,
    })),

  removePlacement: (itemId) =>
    set((state) => ({
      placements: state.placements.filter((p) => p.itemId !== itemId),
      isDirty: true,
    })),

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
      isDirty: false,
    }),

  clearAll: () =>
    set((state) => ({
      placements: [],
      nextZIndex: 1,
      isDirty: state.isDirty || state.placements.length > 0,
    })),

  reset: () => set({ placements: [], nextZIndex: 1, isDirty: false }),
}));
