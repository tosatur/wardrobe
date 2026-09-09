"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CanvasItemPopover } from "@/components/canvas-item-popover";
import { useOutfitCanvasStore, type CanvasPlacement } from "@/lib/outfit-canvas-store";
import { cn } from "@/lib/utils";

const CORNER_DOT_CLASS =
  "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-primary";

export function CanvasItem({ placement }: { placement: CanvasPlacement }) {
  const [open, setOpen] = useState(false);
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const bringToFront = useOutfitCanvasStore((s) => s.bringToFront);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${placement.itemId}`,
    data: { type: "placed", itemId: placement.itemId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute w-1/3 -translate-x-1/2 -translate-y-1/2 touch-none",
        isDragging && "opacity-40",
      )}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        zIndex: placement.zIndex,
      }}
    >
      <div
        className="relative"
        style={{ transform: `scale(${placement.scale}) rotate(${placement.rotation}deg)` }}
      >
        {/* Photoshop-style selection chrome: lives inside the same
            transform as the item so it scales/rotates together with it.
            Kept mounted and faded via opacity (not conditionally
            rendered) so selecting/deselecting is a transition. Purely
            visual for now, pointer-events-none, until drag-to-scale/
            rotate is wired up to the corner dots. */}
        <div
          aria-hidden={!open}
          className={cn(
            "pointer-events-none absolute inset-0 z-10 border-2 border-primary opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
            open && "opacity-100",
          )}
        >
          <div className={cn(CORNER_DOT_CLASS, "top-0 left-0")} />
          <div className={cn(CORNER_DOT_CLASS, "top-0 left-full")} />
          <div className={cn(CORNER_DOT_CLASS, "top-full left-0")} />
          <div className={cn(CORNER_DOT_CLASS, "top-full left-full")} />
        </div>

        <CanvasItemPopover
          placement={placement}
          open={open}
          onOpenChange={setOpen}
          listeners={listeners}
          attributes={attributes}
          onBringToFront={() => bringToFront(placement.itemId)}
          onRemove={() => removePlacement(placement.itemId)}
        />
      </div>
    </div>
  );
}
