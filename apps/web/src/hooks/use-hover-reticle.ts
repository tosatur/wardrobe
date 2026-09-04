import { useEffect, useRef, useState } from "react";
import type { Rect } from "@/components/hover-reticle";

function rectOf(el: HTMLElement): Rect {
  const { top, left, width, height } = el.getBoundingClientRect();
  return { top, left, width, height };
}

/**
 * Tracks whichever tile is currently hovered/focused in a browsing grid, for
 * driving a `HoverReticle`. Shared by the Closet and Outfits grids so the
 * signature crosshair interaction behaves identically on both.
 */
export function useHoverReticle() {
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);

  function handleHoverChange(el: HTMLElement | null) {
    if (el) {
      clearTimeout(clearTimer.current);
      hoveredElRef.current = el;
      setHoverRect(rectOf(el));
    } else {
      // Buffered so crossing the small gap between cards, where the mouse
      // is briefly over neither, doesn't commit "nothing hovered" and snap
      // the reticle out to its parked position before the next card's
      // mouseenter cancels it. Long enough to bridge that gap, short enough
      // to still feel immediate when genuinely leaving the grid.
      clearTimer.current = setTimeout(() => {
        hoveredElRef.current = null;
        setHoverRect(null);
      }, 120);
    }
  }

  // Keeps the reticle aligned with the hovered card across scroll/resize
  // instead of tracking a stale rect snapshot.
  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      if (hoveredElRef.current) setHoverRect(rectOf(hoveredElRef.current));
    }
    function onScrollOrResize() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { hoverRect, handleHoverChange };
}
