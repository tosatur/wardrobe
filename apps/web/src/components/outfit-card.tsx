"use client";

import Link from "next/link";
import type { OutfitDto } from "@wardrobe/shared";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitCardMenu } from "@/components/outfit-card-menu";

export function OutfitCard({ outfit }: { outfit: OutfitDto }) {
  return (
    // A plain div, not a Link, so the kebab menu below isn't a button nested
    // inside an anchor (same reasoning as ItemCard).
    <div className="group relative">
      <Link href={`/outfits/${outfit.id}`} className="block">
        <OutfitCanvas readOnly items={outfit.items} />

        {/* Same hover-reveal caption treatment as ItemCard. */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100">
          <p className="font-heading text-sm font-black tracking-tight text-white">{outfit.name}</p>
        </div>
      </Link>

      <OutfitCardMenu
        outfit={outfit}
        triggerClassName="absolute right-2 bottom-2 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 data-popup-open:opacity-100"
      />
    </div>
  );
}
