"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import type { ItemDto } from "@wardrobe/shared";
import { API_URL } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteItemDialog } from "@/components/delete-item-dialog";

export function ItemCard({
  item,
  onHoverChange,
}: {
  item: ItemDto;
  onHoverChange?: (el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    // break-inside-avoid keeps a card from splitting across the CSS-columns
    // masonry; mb-4 is the vertical gap since `gap` on a columns container
    // only controls the horizontal gutter between columns. A plain div, not
    // a Link, so the kebab button below isn't a button nested inside an
    // anchor.
    <div
      ref={ref}
      className="group relative mb-4 break-inside-avoid"
      onMouseEnter={() => onHoverChange?.(ref.current)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <Link
        href={`/items/${item.id}`}
        className="block"
        onFocus={(e) => {
          // Closing the kebab dropdown or a route modal hands DOM focus
          // back to this link even when the interaction that closed it was
          // a mouse click, and a plain focus check can't tell that apart
          // from a real keyboard tab-in — so only react when the browser
          // itself considers the focus keyboard-driven.
          if (e.currentTarget.matches(":focus-visible")) onHoverChange?.(ref.current);
        }}
        onBlur={() => onHoverChange?.(null)}
      >
        {item.photoCutoutUrl || item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image; rendered at its natural aspect ratio so the masonry rows vary by photo shape
          <img
            src={`${API_URL}${item.photoCutoutUrl ?? item.photoUrl}`}
            crossOrigin="use-credentials"
            alt={item.nickname || item.category.name}
            className="mx-auto block h-auto w-4/5"
          />
        ) : (
          <div className="flex aspect-3/4 w-full items-center justify-center bg-muted font-mono text-xs tracking-wide text-muted-foreground uppercase">
            No photo
          </div>
        )}

        {/* A gradient darken rather than a flat one, stronger near the
            caption at the bottom, clear near the top. No blur: the photo
            itself should stay sharp, only dimmed. */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100">
          <p className="font-heading text-sm font-black tracking-tight text-white">
            {item.nickname || item.category.name}
          </p>
          {item.brand && (
            <p className="font-mono text-[0.65rem] tracking-wide text-white/70 uppercase">
              {item.brand.name}
            </p>
          )}
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className="absolute right-2 bottom-2 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 data-popup-open:opacity-100"
              aria-label="Item actions"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/items/${item.id}`} />}>View</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/items/${item.id}/edit`} />}>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteItemDialog itemId={item.id} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
