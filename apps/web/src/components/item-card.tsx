"use client";

import type { ItemDto } from "@wardrobe/shared";
import { API_URL } from "@/lib/auth-client";
import { ItemCardMenu } from "@/components/item-card-menu";
import { PhotoCaptionOverlay } from "@/components/photo-caption-overlay";
import { BrowseCardShell, CARD_MENU_TRIGGER_CLASSNAME } from "@/components/browse-card-shell";
import { cn } from "@/lib/utils";

export function ItemCard({
  item,
  onHoverChange,
  variant = "masonry",
}: {
  item: ItemDto;
  onHoverChange?: (el: HTMLElement | null) => void;
  /** "masonry" flows at the photo's natural aspect ratio in a CSS-columns
   *  layout; "grid" fits it, uncropped, into a uniform square cell. */
  variant?: "masonry" | "grid";
}) {
  return (
    <BrowseCardShell
      href={`/items/${item.id}`}
      onHoverChange={onHoverChange}
      // break-inside-avoid keeps a card from splitting across the
      // CSS-columns masonry; mb-4 is the vertical gap since `gap` on a
      // columns container only controls the horizontal gutter between
      // columns.
      className={variant === "masonry" ? "mb-4 break-inside-avoid" : "aspect-3/4 overflow-hidden bg-muted"}
      linkClassName={variant === "grid" ? "size-full" : undefined}
      menu={<ItemCardMenu item={item} triggerClassName={CARD_MENU_TRIGGER_CLASSNAME} />}
    >
      {item.photoCutoutUrl || item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image; rendered at its natural aspect ratio so the masonry rows vary by photo shape
        <img
          src={`${API_URL}${item.photoCutoutUrl ?? item.photoUrl}`}
          crossOrigin="use-credentials"
          alt={item.nickname || item.category.name}
          className={cn(
            variant === "masonry" ? "mx-auto block h-auto w-4/5" : "size-full object-contain p-4",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center bg-muted font-mono text-xs tracking-wide text-muted-foreground uppercase",
            variant === "masonry" ? "aspect-3/4 w-full" : "size-full",
          )}
        >
          No photo
        </div>
      )}

      <PhotoCaptionOverlay>
        <p className="font-heading text-sm font-black tracking-tight text-white">
          {item.nickname || item.category.name}
        </p>
        {item.brand && (
          <p className="font-mono text-[0.65rem] tracking-wide text-white/70 uppercase">
            {item.brand.name}
          </p>
        )}
      </PhotoCaptionOverlay>
    </BrowseCardShell>
  );
}
