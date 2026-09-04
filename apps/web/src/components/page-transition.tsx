"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Fades in the page content whenever the top-level route section changes
 * (e.g. /items -> /calendar), not on every sub-page within the same
 * section (e.g. /items -> /items/123) - keying on the full pathname would
 * remount, and re-fade, on every item/outfit detail navigation too.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = pathname.split("/")[1] ?? "";

  return (
    <div key={section} className="animate-in fade-in-0 duration-300">
      {children}
    </div>
  );
}
