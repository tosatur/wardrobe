"use client";

import Link from "next/link";
import { BringToFrontIcon, InfoIcon, Trash2Icon } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { API_URL } from "@/lib/auth-client";
import { useOutfitCanvasStore, type CanvasPlacement } from "@/lib/outfit-canvas-store";
import { cn } from "@/lib/utils";

export function CanvasItem({ placement }: { placement: CanvasPlacement }) {
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const setScale = useOutfitCanvasStore((s) => s.setScale);
  const setRotation = useOutfitCanvasStore((s) => s.setRotation);
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
      <div style={{ transform: `scale(${placement.scale}) rotate(${placement.rotation}deg)` }}>
        <Popover>
          {/* A plain click (no drag movement past dnd-kit's activation
              distance) opens the popover; dragging still works since the
              same listeners are what dnd-kit reads to tell the two apart. */}
          <PopoverTrigger
            render={
              <div className="cursor-grab active:cursor-grabbing" {...listeners} {...attributes} />
            }
          >
            {placement.photoCutoutUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
              <img
                src={`${API_URL}${placement.photoCutoutUrl}`}
                crossOrigin="use-credentials"
                alt={placement.nickname ?? placement.categoryName}
                className="pointer-events-none w-full drop-shadow-md"
              />
            )}
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Size</span>
                <span>{Math.round(placement.scale * 100)}%</span>
              </div>
              <Slider
                value={[placement.scale]}
                onValueChange={(v) =>
                  setScale(placement.itemId, Array.isArray(v) ? v[0] : v)
                }
                min={0.5}
                max={2}
                step={0.05}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rotate</span>
                <span>{placement.rotation}°</span>
              </div>
              <Slider
                value={[placement.rotation]}
                onValueChange={(v) =>
                  setRotation(placement.itemId, Array.isArray(v) ? v[0] : v)
                }
                min={-45}
                max={45}
                step={1}
              />
            </div>

            <ButtonGroup className="w-full">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-1"
                      aria-label="Item info"
                      render={<Link href={`/items/${placement.itemId}`} target="_blank" />}
                    />
                  }
                >
                  <InfoIcon />
                </TooltipTrigger>
                <TooltipContent>Item info</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-1"
                      aria-label="Bring to front"
                      onClick={() => bringToFront(placement.itemId)}
                    />
                  }
                >
                  <BringToFrontIcon />
                </TooltipTrigger>
                <TooltipContent>Bring to front</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="icon"
                      className="flex-1"
                      aria-label="Remove"
                      onClick={() => removePlacement(placement.itemId)}
                    />
                  }
                >
                  <Trash2Icon />
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            </ButtonGroup>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
