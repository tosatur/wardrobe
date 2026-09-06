"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscardChangesDialog } from "@/components/discard-changes-dialog";
import { useUnsavedChangesStore } from "@/lib/unsaved-changes-store";

function findNavigableAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

/**
 * App-wide: while some add/edit form has registered itself as dirty (via
 * useUnsavedChanges), intercepts clicks on in-app links - the nav bar above
 * all else - and confirms before letting the click through. Modal forms
 * (add/edit item) are guarded separately by RouteModal, since closing those
 * doesn't go through a link click.
 */
export function UnsavedChangesGuard() {
  const router = useRouter();
  const isDirty = useUnsavedChangesStore((s) => s.isDirty);
  const setDirty = useUnsavedChangesStore((s) => s.setDirty);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = findNavigableAnchor(event.target);
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;
      if (anchor.href === window.location.href) return;

      event.preventDefault();
      setPendingHref(anchor.href);
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  return (
    <DiscardChangesDialog
      open={pendingHref != null}
      onOpenChange={(open) => !open && setPendingHref(null)}
      onDiscard={() => {
        if (!pendingHref) return;
        setDirty(false);
        router.push(pendingHref);
        setPendingHref(null);
      }}
    />
  );
}
