"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

// Mirrors the routes intercepted under apps/web/src/app/@modal/(.)** (not
// imported - Next's route groups aren't runtime-inspectable). Opening one of
// these as a modal keeps the previous page mounted in the `children` slot,
// but usePathname() below still reports the new URL since it's a global
// subscription, not scoped to a slot.
const MODAL_ROUTE_PATTERNS = [
  /^\/items\/new$/,
  /^\/items\/archive$/,
  /^\/items\/[^/]+$/,
  /^\/items\/[^/]+\/edit$/,
  /^\/outfits\/new$/,
  /^\/outfits\/[^/]+$/,
  /^\/calendar\/[^/]+$/,
];

function isModalRoute(pathname: string) {
  return MODAL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Fades in the page content whenever the top-level route section changes
 * (e.g. /items -> /calendar), not on every sub-page within the same
 * section (e.g. /items -> /items/123) - keying on the full pathname would
 * remount, and re-fade, on every item/outfit detail navigation too.
 *
 * The section is frozen (not read straight off the live pathname) while
 * navigating into a modal route, even a cross-section one (e.g.
 * /calendar -> /outfits/[id]) - otherwise the page mounted behind the modal
 * would remount and replay this fade purely because usePathname() changed
 * out from under it, without the page itself actually navigating. Same
 * render-phase freezing technique as useFrozenSearchParams, for the same
 * root cause.
 *
 * Also the one place that caps every page to the viewport height below the
 * nav (4rem) and makes this element, not the document, the thing that
 * scrolls - so the nav never scrolls out of view and the root/body never
 * needs its own scrollbar, no matter how tall an individual page's content
 * gets.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const livePathname = usePathname();
  const liveSection = livePathname.split("/")[1] ?? "";
  const [section, setSection] = useState(liveSection);

  if (section !== liveSection && !isModalRoute(livePathname)) {
    setSection(liveSection);
  }

  return (
    <div
      key={section}
      className="h-[calc(100vh-4rem)] overflow-y-auto animate-in fade-in-0 duration-300 motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
