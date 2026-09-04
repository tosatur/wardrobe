"use client";

import Link from "next/link";
import type { OutfitDto } from "@wardrobe/shared";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitCardMenu } from "@/components/outfit-card-menu";

export function OutfitListRow({ outfit }: { outfit: OutfitDto }) {
  return (
    <div className="group flex items-center gap-3 border-b border-border py-2 last:border-b-0">
      <Link href={`/outfits/${outfit.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-12 shrink-0">
          <OutfitCanvas readOnly items={outfit.items} coverPhotoUrl={outfit.coverPhotoUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{outfit.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {outfit.items.length} {outfit.items.length === 1 ? "item" : "items"}
            {outfit.wornDates.length > 0
              ? ` · worn ${outfit.wornDates.length} ${outfit.wornDates.length === 1 ? "time" : "times"}`
              : ""}
          </p>
        </div>
      </Link>
      <OutfitCardMenu outfit={outfit} triggerClassName="shrink-0" />
    </div>
  );
}
