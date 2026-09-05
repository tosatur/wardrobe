import type { ReactNode } from "react";
import { DETAIL_SURFACE_CLASS } from "@/lib/detail-surface";
import { cn } from "@/lib/utils";

/**
 * The full-page fallback for every route that also opens as a RouteModal:
 * the same box the modal pops up, sitting inline on a plain page instead of
 * floating over a dimmed backdrop - landing on this URL directly should
 * look like the modal opened over a blank page, not a different layout.
 * No fixed positioning, no backdrop, no max-h/internal scroll - the page
 * itself scrolls.
 */
export function DetailPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 py-8">
      <div className={cn(DETAIL_SURFACE_CLASS, "mx-auto")}>{children}</div>
    </main>
  );
}
