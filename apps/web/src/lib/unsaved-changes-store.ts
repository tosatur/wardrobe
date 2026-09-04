import { create } from "zustand";

// Shared across the app rather than local to one form, so both the global
// nav-link guard and the RouteModal close guard can react to whichever
// add/edit form is currently mounted without prop-drilling between them.
type UnsavedChangesStore = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

export const useUnsavedChangesStore = create<UnsavedChangesStore>((set) => ({
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
}));
