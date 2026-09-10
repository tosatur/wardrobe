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
  /** Scale to pop up to once "grown" - for a placed item this is its own
   *  current scale (times LIFT_SCALE); for a palette tile it's the ratio
   *  that grows the tile up to its eventual on-canvas size. */
  sizeScale: number;
  /** Scale the ghost renders at before the pop-up animation starts. A
   *  placed item is already at its own scale when picked up, so the
   *  animation should pop from there, not from a flat 1 - otherwise a
   *  shrunk item's ghost visibly jumps to size 1 before animating. */
  startScale: number;
  rotation: number;
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
      style={{
        transform: `scale(${grown ? targetScale : ghost.startScale}) rotate(${ghost.rotation}deg)`,
      }}
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
