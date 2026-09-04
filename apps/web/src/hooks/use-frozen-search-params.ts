"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Freezes on the last URLSearchParams seen while actually on `pagePathname`.
 *
 * useSearchParams() reads the *current* URL globally, not scoped to the page
 * that called it - so a still-mounted list page (kept alive behind an
 * intercepted-route modal, e.g. an item/outfit/day detail overlay) sees its
 * filters/view/month reset to their defaults the moment the modal's own
 * soft navigation changes the URL out from under it. This adjusts state
 * during render rather than in an effect - React's own documented pattern
 * for "storing information from previous renders" - so there's no
 * in-between render showing the reset defaults.
 */
export function useFrozenSearchParams(pagePathname: string) {
  const pathname = usePathname();
  const liveSearchParams = useSearchParams();
  const [searchParams, setSearchParams] = useState(liveSearchParams);

  if (pathname === pagePathname && searchParams !== liveSearchParams) {
    setSearchParams(liveSearchParams);
  }

  return searchParams;
}
