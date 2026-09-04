"use client";

import Link from "next/link";
import type { CalendarWearDto } from "@wardrobe/shared";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { OutfitCanvas } from "@/components/outfit-canvas";

export function CalendarWearTile({
  wear,
  className,
}: {
  wear: CalendarWearDto;
  className: string;
}) {
  const itemCount = wear.outfit.items.length;

  return (
    <HoverCard>
      <HoverCardTrigger
        render={<Link href={`/outfits/${wear.outfit.id}`} title={wear.outfit.name} className={className} />}
      >
        <OutfitCanvas readOnly items={wear.outfit.items} />
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-heading text-sm font-black tracking-tight uppercase">{wear.outfit.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"} · worn{" "}
          {new Date(wear.date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
