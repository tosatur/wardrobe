"use client";

import { useRef } from "react";
import Link from "next/link";
import type { OutfitDto } from "@wardrobe/shared";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitCardMenu } from "@/components/outfit-card-menu";
import { PhotoCaptionOverlay } from "@/components/photo-caption-overlay";

export function OutfitCard({
  outfit,
  onHoverChange,
}: {
  outfit: OutfitDto;
  onHoverChange?: (el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    // A plain div, not a Link, so the kebab menu below isn't a button nested
    // inside an anchor (same reasoning as ItemCard).
    <div
      ref={ref}
      className="group relative"
      onMouseEnter={() => onHoverChange?.(ref.current)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <Link
        href={`/outfits/${outfit.id}`}
        className="block"
        onFocus={(e) => {
          // See the identical comment on ItemCard's Link - only react to a
          // genuine keyboard tab-in, not a focus handed back by a closing
          // kebab dropdown or route modal.
          if (e.currentTarget.matches(":focus-visible")) onHoverChange?.(ref.current);
        }}
        onBlur={() => onHoverChange?.(null)}
      >
        <OutfitCanvas readOnly items={outfit.items} coverPhotoUrl={outfit.coverPhotoUrl} />

        <PhotoCaptionOverlay>
          <p className="font-heading text-sm font-black tracking-tight text-white">{outfit.name}</p>
        </PhotoCaptionOverlay>
      </Link>

      <OutfitCardMenu
        outfit={outfit}
        triggerClassName="absolute right-2 bottom-2 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 data-popup-open:opacity-100"
      />
    </div>
  );
}
