"use client";

import { useDroppable } from "@dnd-kit/core";
import type { OutfitItemDto } from "@wardrobe/shared";
import { API_URL } from "@/lib/auth-client";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { CanvasItem } from "@/components/canvas-item";
const FRAME_CLASS = "glass relative aspect-square w-full overflow-hidden";
const TILE_CLASS = "absolute w-1/3 -translate-x-1/2 -translate-y-1/2";

function StaticTile({
  x,
  y,
  zIndex,
  scale,
  rotation,
  flipX,
  photoCutoutUrl,
  label,
}: {
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  photoCutoutUrl: string | null;
  label: string;
}) {
  if (!photoCutoutUrl) return null;

  return (
    <div className={TILE_CLASS} style={{ left: `${x}%`, top: `${y}%`, zIndex }}>
      <div style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image */}
        <img
          src={`${API_URL}${photoCutoutUrl}`}
          crossOrigin="use-credentials"
          alt={label}
          className="pointer-events-none w-full drop-shadow-md"
          style={flipX ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>
    </div>
  );
}

export function OutfitCanvas({
  readOnly,
  items,
  coverPhotoUrl,
}: {
  readOnly?: boolean;
  items?: OutfitItemDto[];
  coverPhotoUrl?: string | null;
}) {
  const placements = useOutfitCanvasStore((s) => s.placements);
  const { setNodeRef } = useDroppable({ id: "outfit-canvas", disabled: readOnly });

  if (readOnly && coverPhotoUrl) {
    return (
      <div className={FRAME_CLASS}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image */}
        <img
          src={`${API_URL}${coverPhotoUrl}`}
          crossOrigin="use-credentials"
          alt=""
          className="size-full object-contain"
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className={FRAME_CLASS}>
        {(items ?? []).map((oi) => (
          <StaticTile
            key={oi.itemId}
            x={oi.x}
            y={oi.y}
            zIndex={oi.zIndex}
            scale={oi.scale}
            rotation={oi.rotation}
            flipX={oi.flipX}
            photoCutoutUrl={oi.item.photoCutoutUrl}
            label={oi.item.nickname ?? oi.item.categoryName}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className={FRAME_CLASS}>
      {placements.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Drag items here
        </div>
      )}
      {placements.map((p) => (
        <CanvasItem key={p.itemId} placement={p} />
      ))}
    </div>
  );
}
