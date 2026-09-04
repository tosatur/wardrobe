"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Fades in the page content whenever the top-level route section changes
 * (e.g. /items -> /calendar), not on every sub-page within the same
 * section (e.g. /items -> /items/123) - keying on the full pathname would
 * remount, and re-fade, on every item/outfit detail navigation too.
 *
 * Also the one place that caps every page to the viewport height below the
 * nav (4rem) and makes this element, not the document, the thing that
 * scrolls - so the nav never scrolls out of view and the root/body never
 * needs its own scrollbar, no matter how tall an individual page's content
 * gets.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = pathname.split("/")[1] ?? "";

  return (
    <div
      key={section}
      className="h-[calc(100vh-4rem)] overflow-y-auto animate-in fade-in-0 duration-300 motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
