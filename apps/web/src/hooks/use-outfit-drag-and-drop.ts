import { useRef, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import type { ActiveDragGhost } from "@/components/outfit-drag-overlay";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The outfit builder's dnd-kit drag lifecycle: picking up a palette tile or
 * a placed item, sizing/labeling the drag ghost to match, and committing the
 * drop as a new placement, a moved placement, or - for a placed item dropped
 * back on the palette - a removal.
 */
export function useOutfitDragAndDrop() {
  const placements = useOutfitCanvasStore((s) => s.placements);
  const addPlacement = useOutfitCanvasStore((s) => s.addPlacement);
  const movePlacement = useOutfitCanvasStore((s) => s.movePlacement);
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const bringToFront = useOutfitCanvasStore((s) => s.bringToFront);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeDragGhost, setActiveDragGhost] = useState<ActiveDragGhost>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "placed") {
      bringToFront(data.itemId as string);
      const placement = placements.find((p) => p.itemId === data.itemId);
      if (placement) {
        setActiveDragGhost({
          photoCutoutUrl: placement.photoCutoutUrl,
          label: placement.nickname ?? placement.categoryName,
          sizeScale: placement.scale,
          startScale: placement.scale,
          rotation: placement.rotation,
          flipX: placement.flipX,
        });
      }
    } else if (data?.type === "palette") {
      const canvasWidth = canvasFrameRef.current?.getBoundingClientRect().width;
      const tileWidth = data.tileWidth as number | null;
      // 1/3 matches CanvasItem's w-1/3 sizing class.
      const sizeScale = canvasWidth && tileWidth ? (canvasWidth * (1 / 3)) / tileWidth : 1;
      setActiveDragGhost({
        photoCutoutUrl: data.item.photoCutoutUrl,
        label: data.item.nickname ?? data.item.categoryName,
        sizeScale,
        startScale: 1,
        rotation: 0,
        flipX: false,
      });
    }
  }

  function handleDragCancel() {
    setActiveDragGhost(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragGhost(null);
    const data = event.active.data.current;

    if (event.over?.id === "item-palette" && data?.type === "placed") {
      removePlacement(data.itemId as string);
      return;
    }

    if (!event.over || event.over.id !== "outfit-canvas") return;
    const canvasRect = event.over.rect;
    const droppedRect = event.active.rect.current.translated;
    if (!droppedRect) return;

    const centerX = droppedRect.left + droppedRect.width / 2;
    const centerY = droppedRect.top + droppedRect.height / 2;
    const pctX = clamp(((centerX - canvasRect.left) / canvasRect.width) * 100, 0, 100);
    const pctY = clamp(((centerY - canvasRect.top) / canvasRect.height) * 100, 0, 100);

    if (data?.type === "palette") addPlacement(data.item, pctX, pctY);
    if (data?.type === "placed") movePlacement(data.itemId as string, pctX, pctY);
  }

  return {
    sensors,
    activeDragGhost,
    canvasFrameRef,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
