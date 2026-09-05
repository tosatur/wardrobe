"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The one toolbar shape for every entity detail/edit surface (item detail,
 * item new/edit, outfit detail): a back button, the entity's name, and its
 * primary actions (Save, or Edit/Archive/Delete), pinned to the top of the
 * scrolling content instead of living at the bottom of a form or inside a
 * card header that scrolls out of view. `backHref` is only passed on the
 * full-page fallback - inside a RouteModal, the dialog's own close control
 * already does that job, so the toolbar there is title + actions only.
 */
export function EntityToolbar({
  backLabel,
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
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-4 rounded-sm border border-border bg-card px-6 py-4",
        // No backHref means this toolbar is riding inside a RouteModal
        // (see the doc comment above) - reserve room so it doesn't paint
        // over the dialog's own close button in the same corner. A right
        // margin, not padding: padding only pushes the toolbar's own
        // content inward, the opaque box itself would still extend under
        // the close button and paint over it.
        !backHref && "mr-14",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={backLabel ?? "Back"}
                  render={<Link href={backHref} />}
                />
              }
            >
              <ArrowLeftIcon />
            </TooltipTrigger>
            <TooltipContent>{backLabel ?? "Back"}</TooltipContent>
          </Tooltip>
        )}
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
