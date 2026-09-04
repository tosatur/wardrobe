"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  children,
  className,
}: {
  title: string;
  description?: string;
  hideHeader?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl", className)}>
        <DialogHeader className={hideHeader ? "sr-only" : undefined}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
