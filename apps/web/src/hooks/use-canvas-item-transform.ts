import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

const SCALE_MIN = 0.5;
const SCALE_MAX = 2;
// Snap targets when the user holds Shift while rotating: absolute multiples
// of 45deg (0, 45, 90, ...), not the drag's own start rotation + 45.
const ROTATION_SNAP_STEP = 45;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Keeps rotation within the [-180, 180] range the outfit schema validates,
// while still letting a single drag spin all the way around (360deg) rather
// than stopping at a hard limit.
function normalizeAngle(deg: number) {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

function centerOf(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Photoshop-style drag-to-scale/rotate for a placed canvas item. Both
 * gestures measure from the item's screen center relative to where the
 * pointer went down, rather than the handle's nominal position, so there's
 * no jump if the pointer wasn't clicked exactly on the handle's edge.
 * Plain Pointer Events + setPointerCapture - independent of dnd-kit, which
 * only drives the whole-item move drag.
 */
export function useCanvasItemTransform({
  boxRef,
  scale,
  rotation,
  onScaleChange,
  onRotationChange,
  onTransformStart,
  onTransformEnd,
}: {
  boxRef: RefObject<HTMLElement | null>;
  scale: number;
  rotation: number;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  /** Fired on pointerdown, before the drag starts - e.g. to hide the
   *  actions popover, which doesn't track a scaling/rotating trigger. */
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}) {
  function handleScalePointerDown(e: ReactPointerEvent<HTMLElement>) {
    const box = boxRef.current;
    if (!box) return;
    e.stopPropagation();
    e.preventDefault();
    onTransformStart?.();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const center = centerOf(box);
    const startDistance = Math.hypot(e.clientX - center.x, e.clientY - center.y);
    const startScale = scale;

    function handleMove(ev: PointerEvent) {
      const distance = Math.hypot(ev.clientX - center.x, ev.clientY - center.y);
      const ratio = startDistance === 0 ? 1 : distance / startDistance;
      onScaleChange(clamp(startScale * ratio, SCALE_MIN, SCALE_MAX));
    }
    function handleUp(ev: PointerEvent) {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
      onTransformEnd?.();
    }
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  }

  function handleRotatePointerDown(e: ReactPointerEvent<HTMLElement>) {
    const box = boxRef.current;
    if (!box) return;
    e.stopPropagation();
    e.preventDefault();
    onTransformStart?.();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const center = centerOf(box);
    const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
    const startRotation = rotation;

    function handleMove(ev: PointerEvent) {
      const angle = Math.atan2(ev.clientY - center.y, ev.clientX - center.x);
      const deltaDeg = ((angle - startAngle) * 180) / Math.PI;
      let next = startRotation + deltaDeg;
      if (ev.shiftKey) next = Math.round(next / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
      onRotationChange(normalizeAngle(next));
    }
    function handleUp(ev: PointerEvent) {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
      onTransformEnd?.();
    }
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  }

  return { handleScalePointerDown, handleRotatePointerDown };
}
