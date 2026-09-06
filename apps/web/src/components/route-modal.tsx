"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiscardChangesDialog } from "@/components/discard-changes-dialog";
import { useUnsavedChangesStore } from "@/lib/unsaved-changes-store";
import { DETAIL_SURFACE_CLASS } from "@/lib/detail-surface";
import { cn } from "@/lib/utils";

/**
 * Wraps intercepted-route content (add/view/edit item) in a Dialog backed by
 * local open state, not the route directly. Closing it (X, backdrop,
 * Escape) flips that state to false first, so the Dialog's own closing
 * animation gets to play; only once it finishes (onOpenChangeComplete) do
 * we call router.back() to actually drop the URL segment. Navigating away
 * immediately would unmount the modal mid-animation instead of letting it
 * play out.
 *
 * `title`/`description` back the dialog's accessible name. Pass
 * `hideHeader` when the content already renders its own visible heading, so
 * the header stays present for screen readers (sr-only) without doubling up
 * visually.
 */
export function RouteModal({
  title,
  description,
  hideHeader,
  showCloseButton = true,
  children,
  className,
}: {
  title: string;
  description?: string;
  hideHeader?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [openedPathname] = useState(pathname);
  const [open, setOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDirty = useUnsavedChangesStore((s) => s.isDirty);
  const setDirty = useUnsavedChangesStore((s) => s.setDirty);

  // A link inside the modal's own content can lead somewhere this @modal
  // slot has no interceptor for (e.g. from an item's detail view to an
  // outfit page). Next.js then has nothing new to render in the slot and
  // keeps this stale popup mounted on top of the page that navigated in.
  // Once the URL has moved off the route this modal was opened for, stop
  // rendering rather than calling router.back() again — the navigation
  // already happened, so going back would undo it.
  if (pathname !== openedPathname) return null;

  // Closing (X, backdrop, Escape) on a form with unsaved changes asks first
  // instead of discarding silently. A successful save navigates away on its
  // own (see ItemForm/OutfitBuilder), which never reaches this handler.
  function handleOpenChange(next: boolean) {
    if (next) return setOpen(true);
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={(open) => {
          if (!open) router.back();
        }}
      >
        <DialogContent
          showCloseButton={showCloseButton}
          className={cn(DETAIL_SURFACE_CLASS, "max-h-[85vh] overflow-y-auto", className)}
        >
          <DialogHeader className={hideHeader ? "sr-only" : undefined}>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>

      <DiscardChangesDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onDiscard={() => {
          setDirty(false);
          setOpen(false);
        }}
      />
    </>
  );
}
