"use client";

import { useEffect, useState } from "react";
import { DragOverlay } from "@dnd-kit/core";
import { API_URL } from "@/lib/auth-client";

// Small "picked up" pop applied to every dragged ghost; palette-origin
// drags additionally multiply in sizeScale to preview the item's actual
// (usually larger, viewport-dependent) size once placed on the canvas.
const LIFT_SCALE = 1.05;

export type ActiveDragGhost = {
  photoCutoutUrl: string | null;
  label: string;
  sizeScale: number;
} | null;

function GhostImage({ ghost }: { ghost: NonNullable<ActiveDragGhost> }) {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const targetScale = LIFT_SCALE * ghost.sizeScale;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
    <img
      src={`${API_URL}${ghost.photoCutoutUrl}`}
      crossOrigin="use-credentials"
      alt={ghost.label}
      className="h-full w-full object-contain drop-shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none"
      style={{ transform: `scale(${grown ? targetScale : 1})` }}
    />
  );
}

export function OutfitDragOverlay({ ghost }: { ghost: ActiveDragGhost }) {
  return (
    <DragOverlay dropAnimation={null}>
      {ghost?.photoCutoutUrl ? <GhostImage ghost={ghost} /> : null}
    </DragOverlay>
  );
}
