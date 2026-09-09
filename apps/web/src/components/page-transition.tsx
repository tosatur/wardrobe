"use client";

import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useState, type ReactNode } from "react";

/**
 * Fades in the page content whenever the top-level route section changes
 * (e.g. /items -> /calendar), not on every sub-page within the same
 * section (e.g. /items -> /items/123) - keying on the full pathname would
 * remount, and re-fade, on every item/outfit detail navigation too.
 *
 * The section is frozen (not read straight off the live pathname) while a
 * modal is open in the @modal parallel slot, even a cross-section one (e.g.
 * /calendar -> /outfits/[id]) - otherwise the page mounted behind the modal
 * would remount and replay this fade purely because usePathname() changed
 * out from under it (a global subscription, not scoped to the `children`
 * slot), without the page itself actually navigating.
 * useSelectedLayoutSegment("modal") reads the @modal slot's own active
 * segment instead - null when @modal/default.tsx (no interception) is
 * active - so this doesn't need to know the shape of every intercepted
 * route the way a pathname-pattern check would. Same render-phase freezing
 * technique as useFrozenSearchParams, for the same root cause.
 *
 * Also the one place that caps every page to the viewport height below the
 * nav (4rem) and makes this element, not the document, the thing that
 * scrolls - so the nav never scrolls out of view and the root/body never
 * needs its own scrollbar, no matter how tall (or wide) an individual
 * page's content gets. html/body are pinned to 100%/hidden overflow (see
 * globals.css), so this is the only element in the tree that's allowed to
 * scroll at all. `.no-scrollbar` keeps that scrolling invisible (wheel,
 * touch and keyboard scrolling still work) rather than reserving gutter
 * space for a track - a page that's sometimes tall enough to need scrolling
 * and sometimes not never shows an empty track or shifts width either way.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const livePathname = usePathname();
  const modalSegment = useSelectedLayoutSegment("modal");
  const liveSection = livePathname.split("/")[1] ?? "";
  const [section, setSection] = useState(liveSection);

  if (section !== liveSection && modalSegment === null) {
    setSection(liveSection);
  }

  return (
    <div
      key={section}
      className="no-scrollbar h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-auto animate-in fade-in-0 duration-300 motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
