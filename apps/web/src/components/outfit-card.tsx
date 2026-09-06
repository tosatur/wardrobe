"use client";

import type { OutfitDto } from "@wardrobe/shared";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitCardMenu } from "@/components/outfit-card-menu";
import { PhotoCaptionOverlay } from "@/components/photo-caption-overlay";
import { BrowseCardShell, CARD_MENU_TRIGGER_CLASSNAME } from "@/components/browse-card-shell";

export function OutfitCard({
  outfit,
  onHoverChange,
}: {
  outfit: OutfitDto;
  onHoverChange?: (el: HTMLElement | null) => void;
}) {
  return (
    <BrowseCardShell
      href={`/outfits/${outfit.id}`}
      onHoverChange={onHoverChange}
      menu={<OutfitCardMenu outfit={outfit} triggerClassName={CARD_MENU_TRIGGER_CLASSNAME} />}
    >
      <OutfitCanvas readOnly items={outfit.items} coverPhotoUrl={outfit.coverPhotoUrl} />

      <PhotoCaptionOverlay>
        <p className="font-heading text-sm font-black tracking-tight text-white">{outfit.name}</p>
      </PhotoCaptionOverlay>
    </BrowseCardShell>
  );
}
