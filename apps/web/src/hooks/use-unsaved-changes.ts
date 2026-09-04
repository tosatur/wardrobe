"use client";

import { useEffect } from "react";
import { useUnsavedChangesStore } from "@/lib/unsaved-changes-store";

/**
 * Registers a form's dirty state with the shared unsaved-changes store, so
 * UnsavedChangesGuard (nav-link clicks) and RouteModal (dialog close) can
 * warn before the user navigates away from it. Also warns on a hard
 * reload/tab close via `beforeunload`, which those two can't intercept.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const setDirty = useUnsavedChangesStore((s) => s.setDirty);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
