"use client";

import { XIcon } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/auth-client";
import { useOutfitCanvasStore, type CanvasPlacement } from "@/lib/outfit-canvas-store";
import { cn } from "@/lib/utils";

export function CanvasItem({ placement }: { placement: CanvasPlacement }) {
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${placement.itemId}`,
    data: { type: "placed", itemId: placement.itemId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group absolute w-1/3 -translate-x-1/2 -translate-y-1/2 touch-none",
        isDragging && "opacity-40",
      )}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        zIndex: placement.zIndex,
      }}
    >
      <div className="cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
        {placement.photoCutoutUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
          <img
            src={`${API_URL}${placement.photoCutoutUrl}`}
            crossOrigin="use-credentials"
            alt={placement.nickname ?? placement.categoryName}
            className="pointer-events-none w-full drop-shadow-md"
          />
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removePlacement(placement.itemId)}
        className="absolute -top-2 -right-2 rounded-full bg-background opacity-0 transition-opacity group-hover:opacity-100"
      >
        <XIcon />
      </Button>
    </div>
  );
}
