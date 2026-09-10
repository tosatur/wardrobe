"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { BringToFrontIcon, FlipHorizontal2Icon, InfoIcon, Trash2Icon } from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { API_URL } from "@/lib/auth-client";
import type { CanvasPlacement } from "@/lib/outfit-canvas-store";

const OVERLAY_BUTTON_CLASS =
  "flex-1 border-white/20 bg-black/40 backdrop-blur-md hover:bg-black/55";

export function CanvasItemPopover({
  placement,
  open,
  onOpenChange,
  listeners,
  attributes,
  anchorRef,
  onBringToFront,
  onToggleFlipX,
  onRemove,
}: {
  placement: CanvasPlacement;
  open: boolean;
  onOpenChange: NonNullable<PopoverPrimitive.Root.Props["onOpenChange"]>;
  listeners: DraggableSyntheticListeners;
  attributes: DraggableAttributes;
  /** An untransformed element kept in sync with the item's current
   *  on-screen size (see CanvasItem), used as the popover's anchor instead
   *  of the trigger itself - Base UI's position tracking is ResizeObserver-
   *  based and can't see a transform-only (scale/rotate) change on an
   *  ancestor, only a real layout resize, which this element gets. */
  anchorRef: RefObject<HTMLDivElement | null>;
  onBringToFront: () => void;
  onToggleFlipX: () => void;
  onRemove: () => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {/* A plain click (no drag movement past dnd-kit's activation
          distance) opens the popover; dragging still works since the
          same listeners are what dnd-kit reads to tell the two apart. */}
      <PopoverTrigger
        render={<div className="cursor-grab active:cursor-grabbing" {...listeners} {...attributes} />}
      >
        {placement.photoCutoutUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
          <img
            src={`${API_URL}${placement.photoCutoutUrl}`}
            crossOrigin="use-credentials"
            alt={placement.nickname ?? placement.categoryName}
            className="pointer-events-none w-full drop-shadow-md"
            style={placement.flipX ? { transform: "scaleX(-1)" } : undefined}
          />
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={16}
        anchor={anchorRef}
        className="w-fit rounded-none bg-transparent p-0 shadow-none ring-0"
      >
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className={`${OVERLAY_BUTTON_CLASS} text-white`}
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
                  className={`${OVERLAY_BUTTON_CLASS} text-white`}
                  aria-label="Bring to front"
                  onClick={onBringToFront}
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
                  variant="outline"
                  size="icon"
                  className={`${OVERLAY_BUTTON_CLASS} text-white`}
                  aria-label="Flip"
                  onClick={onToggleFlipX}
                />
              }
            >
              <FlipHorizontal2Icon />
            </TooltipTrigger>
            <TooltipContent>Flip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon"
                  className={`${OVERLAY_BUTTON_CLASS} text-destructive`}
                  aria-label="Remove"
                  onClick={onRemove}
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
  );
}
