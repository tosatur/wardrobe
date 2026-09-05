"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The one toolbar shape for every entity detail/edit surface: a leading
 * back/close control, the entity's name, and its primary actions, bled
 * edge-to-edge across the top of the shared box (see detail-surface.ts)
 * like a window's own title bar - sticky, so it stays reachable while a
 * long form scrolls.
 *
 * The leading control sits in the same spot regardless of context: with
 * `backHref` it's a real link back to the list (the full-page fallback,
 * which has no other way to leave); without one it closes the enclosing
 * RouteModal via DialogClose instead. Closing the modal and navigating
 * back both mean "leave this view," so they get the same control in the
 * same place, not a link in one context and a separate dialog "X" in the
 * other.
 */
export function EntityToolbar({
  backLabel = "Back",
  backHref,
  title,
  actions,
}: {
  backLabel?: string;
  backHref?: string;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 rounded-t-xl border-b border-border bg-muted/50 px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            render={
              backHref ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={backLabel}
                  render={<Link href={backHref} />}
                />
              ) : (
                <DialogClose
                  render={<Button variant="ghost" size="icon" aria-label={backLabel} />}
                />
              )
            }
          >
            <ArrowLeftIcon />
          </TooltipTrigger>
          <TooltipContent>{backLabel}</TooltipContent>
        </Tooltip>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
