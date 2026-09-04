"use client";

import { currencySymbol } from "@wardrobe/shared";
import { Badge } from "@/components/ui/badge";

type AnalyzedItem = {
  colors: { id: string; name: string; hex: string }[];
  price: number | null;
  currency: string;
};

/**
 * Colour breakdown and cost, derived from whichever items are currently on
 * the canvas/in the outfit - works from the outfit editor's live
 * CanvasPlacement[] just as well as a saved outfit's OutfitItemDto[].
 * No cross-currency conversion, so mixed-currency outfits show one total
 * per currency rather than a single (wrong) combined number.
 */
export function OutfitAnalysis({ items }: { items: AnalyzedItem[] }) {
  if (items.length === 0) return null;

  const colorCounts = new Map<string, { name: string; hex: string; count: number }>();
  for (const item of items) {
    for (const color of item.colors) {
      const existing = colorCounts.get(color.id);
      if (existing) existing.count += 1;
      else colorCounts.set(color.id, { name: color.name, hex: color.hex, count: 1 });
    }
  }
  const colors = [...colorCounts.values()].sort((a, b) => b.count - a.count);

  const totalsByCurrency = new Map<string, number>();
  for (const item of items) {
    if (item.price == null) continue;
    totalsByCurrency.set(item.currency, (totalsByCurrency.get(item.currency) ?? 0) + item.price);
  }
  const pricedCount = items.filter((item) => item.price != null).length;

  if (colors.length === 0 && totalsByCurrency.size === 0) return null;

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Colours</p>
          <div className="flex flex-wrap gap-1">
            {colors.map((color) => (
              <Badge key={color.name} variant="outline" className="gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-full border"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
                {color.count > 1 ? ` × ${color.count}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {totalsByCurrency.size > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Cost{pricedCount < items.length ? ` (${pricedCount} of ${items.length} priced)` : ""}
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-medium">
            {[...totalsByCurrency.entries()].map(([currency, total]) => (
              <span key={currency}>
                {currencySymbol(currency)}
                {total.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
