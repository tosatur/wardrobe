import { create } from "zustand";
import type { OutfitItemDto } from "@wardrobe/shared";

export type CanvasPlacement = {
  itemId: string;
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
  nickname: string | null;
  categoryName: string;
  photoCutoutUrl: string | null;
  colors: { id: string; name: string; hex: string }[];
  price: number | null;
  currency: string;
};

type PaletteItem = {
  id: string;
  nickname: string | null;
  categoryName: string;
  photoCutoutUrl: string | null;
  colors: { id: string; name: string; hex: string }[];
  price: number | null;
  currency: string;
};

type OutfitCanvasStore = {
  placements: CanvasPlacement[];
  nextZIndex: number;
  // Content changes only (add/move/remove) - merely picking an item up
  // (bringToFront, fired on drag start) doesn't count, or every click on a
  // placed item would trip the unsaved-changes guard.
  isDirty: boolean;
  /** Which placed item currently shows the selection border/handles - kept
   *  here (rather than local state per CanvasItem) so selecting one item
   *  is exclusive: it's the single source of truth every CanvasItem reads
   *  and compares its own itemId against. */
  selectedItemId: string | null;
  addPlacement: (item: PaletteItem, x: number, y: number) => void;
  movePlacement: (itemId: string, x: number, y: number) => void;
  setScale: (itemId: string, scale: number) => void;
  setRotation: (itemId: string, rotation: number) => void;
  bringToFront: (itemId: string) => void;
  removePlacement: (itemId: string) => void;
  selectItem: (itemId: string | null) => void;
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
  selectedItemId: null,

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
            scale: 1,
            rotation: 0,
            nickname: item.nickname,
            categoryName: item.categoryName,
            photoCutoutUrl: item.photoCutoutUrl,
            colors: item.colors,
            price: item.price,
            currency: item.currency,
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

  setScale: (itemId, scale) =>
    set((state) => ({
      placements: state.placements.map((p) => (p.itemId === itemId ? { ...p, scale } : p)),
      isDirty: true,
    })),

  setRotation: (itemId, rotation) =>
    set((state) => ({
      placements: state.placements.map((p) => (p.itemId === itemId ? { ...p, rotation } : p)),
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
      selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      isDirty: true,
    })),

  selectItem: (itemId) => set({ selectedItemId: itemId }),

  loadPlacements: (items) =>
    set({
      selectedItemId: null,
      placements: items.map((oi) => ({
        itemId: oi.itemId,
        x: oi.x,
        y: oi.y,
        zIndex: oi.zIndex,
        scale: oi.scale,
        rotation: oi.rotation,
        nickname: oi.item.nickname,
        categoryName: oi.item.categoryName,
        photoCutoutUrl: oi.item.photoCutoutUrl,
        colors: oi.item.colors,
        price: oi.item.price,
        currency: oi.item.currency,
      })),
      nextZIndex: Math.max(0, ...items.map((oi) => oi.zIndex)) + 1,
      isDirty: false,
    }),

  clearAll: () =>
    set((state) => ({
      placements: [],
      nextZIndex: 1,
      selectedItemId: null,
      isDirty: state.isDirty || state.placements.length > 0,
    })),

  reset: () => set({ placements: [], nextZIndex: 1, selectedItemId: null, isDirty: false }),
}));
