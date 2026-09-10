"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CanvasItemPopover } from "@/components/canvas-item-popover";
import { useCanvasItemTransform } from "@/hooks/use-canvas-item-transform";
import { useOutfitCanvasStore, type CanvasPlacement } from "@/lib/outfit-canvas-store";
import { cn } from "@/lib/utils";

// Fixed on-screen pixel sizes for the selection chrome. The chrome lives
// inside the item's own scale() transform (so its position tracks the
// item's corners as it resizes/rotates), which would otherwise make the
// border and handles visually grow/shrink with the item - dividing by the
// current scale here cancels that back out to a constant rendered size.
const BORDER_WIDTH_PX = 2;
const HANDLE_SIZE_PX = 10;
const ROTATE_ZONE_SIZE_PX = 28;

// CSS has no built-in rotate-cursor keyword, so it's a small inline SVG - a
// 90deg circular arc with an arrowhead at each end, matching Photoshop's
// free-transform corner cursor. One base shape (drawn for the top-left
// corner) rotated per corner (its base angle plus the item's current
// rotation, mirroring resizeCursor below) via an SVG <g transform>, so the
// arc always opens away from whichever corner it's hovering, tracking the
// item as it spins.
function rotateCursor(deg: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">` +
    `<g transform="rotate(${deg} 12 12)">` +
    `<path d="M12 4 A8 8 0 0 0 4 12" fill="none" stroke="white" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M12 4 A8 8 0 0 0 4 12" fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M12 4 l-2.6 0.9 M12 4 l0.9 2.6" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M12 4 l-2.6 0.9 M12 4 l0.9 2.6" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M4 12 l0.9 -2.6 M4 12 l2.6 0.9" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M4 12 l0.9 -2.6 M4 12 l2.6 0.9" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round"/>` +
    `</g></svg>`;
  return `url('data:image/svg+xml;utf8,${svg}') 11 11, alias`;
}

// Like a native ew-resize double arrow, but drawn ourselves and rotated to
// the corner's actual on-screen diagonal (its base angle plus the item's
// current rotation) - so, as in Photoshop, scaling from a corner shows a
// cursor aligned with that corner's edge even after the item has been
// spun, not just the fixed 8-direction nwse/nesw/ns/ew the CSS keywords give.
function resizeCursor(deg: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">` +
    `<g transform="rotate(${deg} 12 12)">` +
    `<path d="M5 12 H19" fill="none" stroke="white" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M5 12 H19" fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M5 12 l3 -3 M5 12 l3 3 M19 12 l-3 -3 M19 12 l-3 3" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M5 12 l3 -3 M5 12 l3 3 M19 12 l-3 -3 M19 12 l-3 3" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round"/>` +
    `</g></svg>`;
  return `url('data:image/svg+xml;utf8,${svg}') 11 11, alias`;
}

const CORNERS = [
  // zoneOffset anchors the (larger) rotate zone so it sits entirely
  // outside the border on that corner's outward diagonal, rather than
  // centered on the corner point like the scale dot - e.g. the top-left
  // zone is pushed up and left by its own full size, off the item
  // entirely, instead of overlapping the item's top-left quadrant.
  // resizeCursorBaseDeg/rotateCursorBaseDeg are that corner's cursor angle
  // at rotation 0 (matching the standard nwse/nesw directions, and the arc
  // opening toward that corner); the item's current rotation is added to
  // both when rendering the cursors, so they track the item as it spins.
  {
    position: "top-0 left-0",
    resizeCursorBaseDeg: 45,
    rotateCursorBaseDeg: 0,
    zoneOffset: "-translate-x-full -translate-y-full",
  },
  {
    position: "top-0 left-full",
    resizeCursorBaseDeg: -45,
    rotateCursorBaseDeg: 90,
    zoneOffset: "-translate-y-full",
  },
  {
    position: "top-full left-0",
    resizeCursorBaseDeg: -45,
    rotateCursorBaseDeg: 270,
    zoneOffset: "-translate-x-full",
  },
  {
    position: "top-full left-full",
    resizeCursorBaseDeg: 45,
    rotateCursorBaseDeg: 180,
    zoneOffset: "",
  },
] as const;

export function CanvasItem({ placement }: { placement: CanvasPlacement }) {
  // Selection (the border+handles) and the popover (info/bring-to-front/
  // remove) are the exact same state - selectedItemId in the shared store,
  // so selecting one item is also exclusive across the canvas. The popover
  // is a controlled component driven by it, not a separate local flag.
  const boxRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  // Base UI's Popover tracks its anchor via ResizeObserver/
  // IntersectionObserver, neither of which reliably notices a
  // transform-only (scale/rotate) change on an ancestor with no real
  // layout resize - anchoring directly to boxRef left the popover lagging
  // behind during a drag. This separate, untransformed anchor gets its
  // real width/height set (below) to match boxRef's current on-screen
  // size on every scale/rotate change, which IS a genuine layout mutation
  // ResizeObserver is guaranteed to catch.
  const anchorRef = useRef<HTMLDivElement>(null);
  const selectedItemId = useOutfitCanvasStore((s) => s.selectedItemId);
  const selectItem = useOutfitCanvasStore((s) => s.selectItem);
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const bringToFront = useOutfitCanvasStore((s) => s.bringToFront);
  const setScale = useOutfitCanvasStore((s) => s.setScale);
  const setRotation = useOutfitCanvasStore((s) => s.setRotation);
  const toggleFlipX = useOutfitCanvasStore((s) => s.toggleFlipX);
  const selected = selectedItemId === placement.itemId;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${placement.itemId}`,
    data: { type: "placed", itemId: placement.itemId },
  });

  function handleOpenChange(
    next: boolean,
    eventDetails: PopoverPrimitive.Root.ChangeEventDetails,
  ) {
    // Base UI treats a pointerdown on our corner/rotate handles as an
    // "outside press" (they're siblings of the trigger, not inside the
    // popover) and would otherwise close it mid-drag. Cancel just that
    // case so the popover - and the selection it's synced to - stays up
    // while the user is actively scaling or rotating.
    if (
      !next &&
      eventDetails.reason === "outside-press" &&
      eventDetails.event.target instanceof Node &&
      chromeRef.current?.contains(eventDetails.event.target)
    ) {
      eventDetails.cancel();
      return;
    }
    selectItem(next ? placement.itemId : null);
  }

  const { handleScalePointerDown, handleRotatePointerDown } = useCanvasItemTransform({
    boxRef,
    scale: placement.scale,
    rotation: placement.rotation,
    onScaleChange: (scale) => setScale(placement.itemId, scale),
    onRotationChange: (rotation) => setRotation(placement.itemId, rotation),
  });

  function syncAnchorSize() {
    const box = boxRef.current;
    const anchor = anchorRef.current;
    if (!box || !anchor) return;
    const rect = box.getBoundingClientRect();
    anchor.style.width = `${rect.width}px`;
    anchor.style.height = `${rect.height}px`;
  }

  // Drives most updates: scale/rotation change on (almost) every render
  // during a drag, and this stays in the same render pass as that change.
  useLayoutEffect(syncAnchorSize, [placement.scale, placement.rotation]);

  // Covers the gap that misses: the item's <img> loads asynchronously, so
  // at mount boxRef's real layout box (which its height is derived from)
  // is briefly 0 - collapsing the anchor and, on a first open before any
  // scale/rotate edit, opening the popover pinned to the item's center.
  // ResizeObserver catches that real resize once the image loads, where
  // the effect above (keyed only on scale/rotation, neither of which
  // change here) would otherwise never re-run.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(syncAnchorSize);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

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
      {/* Untransformed popover anchor, sized to match boxRef's current
          on-screen footprint via the layout effect above - see its
          comment for why this indirection exists. */}
      <div
        ref={anchorRef}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={boxRef}
        className="relative"
        style={{ transform: `scale(${placement.scale}) rotate(${placement.rotation}deg)` }}
      >
        {/* Photoshop-style selection chrome: lives inside the same
            transform as the item so it tracks its corners as it
            scales/rotates. Kept mounted and faded via opacity (not
            conditionally rendered) so selecting/deselecting is a
            transition. The border itself stays pointer-events-none (just
            a visual frame); each handle re-enables pointer events on
            itself, and only while selected, so it doesn't intercept
            clicks on the image underneath when deselected. */}
        <div
          ref={chromeRef}
          aria-hidden={!selected}
          className={cn(
            "pointer-events-none absolute inset-0 z-10 border-primary opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
            selected && "opacity-100",
          )}
          style={{ borderWidth: BORDER_WIDTH_PX / placement.scale }}
        >
          {/* Each corner has two separate hit zones, like Photoshop's
              free-transform: the small dot, exactly on the corner, scales;
              the larger rotate zone is anchored just outside the border on
              that corner's outward diagonal, never overlapping the item's
              own area. The dot is a later sibling, so on the sliver where
              they meet it still wins the hit test. */}
          {CORNERS.map(({ position, resizeCursorBaseDeg, rotateCursorBaseDeg, zoneOffset }) => (
            <Fragment key={position}>
              <div
                onPointerDown={selected ? handleRotatePointerDown : undefined}
                className={cn(
                  "absolute",
                  position,
                  zoneOffset,
                  selected ? "pointer-events-auto" : "pointer-events-none",
                )}
                style={{
                  width: ROTATE_ZONE_SIZE_PX / placement.scale,
                  height: ROTATE_ZONE_SIZE_PX / placement.scale,
                  cursor: rotateCursor(rotateCursorBaseDeg + placement.rotation),
                }}
              />
              <div
                onPointerDown={selected ? handleScalePointerDown : undefined}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border border-background bg-primary",
                  position,
                  selected ? "pointer-events-auto" : "pointer-events-none",
                )}
                style={{
                  width: HANDLE_SIZE_PX / placement.scale,
                  height: HANDLE_SIZE_PX / placement.scale,
                  cursor: resizeCursor(resizeCursorBaseDeg + placement.rotation),
                }}
              />
            </Fragment>
          ))}
        </div>

        <CanvasItemPopover
          placement={placement}
          open={selected}
          onOpenChange={handleOpenChange}
          listeners={listeners}
          attributes={attributes}
          anchorRef={anchorRef}
          onBringToFront={() => bringToFront(placement.itemId)}
          onToggleFlipX={() => toggleFlipX(placement.itemId)}
          onRemove={() => removePlacement(placement.itemId)}
        />
      </div>
    </div>
  );
}
