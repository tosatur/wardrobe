"use client";

import Link from "next/link";
import type { ItemDto } from "@wardrobe/shared";
import { currencySymbol } from "@wardrobe/shared";
import { API_URL } from "@/lib/auth-client";
import { ItemCardMenu } from "@/components/item-card-menu";

export function ItemListRow({ item }: { item: ItemDto }) {
  return (
    <div className="group flex items-center gap-3 border-b border-border py-2 last:border-b-0">
      <Link href={`/items/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
          {item.photoCutoutUrl || item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
            <img
              src={`${API_URL}${item.photoCutoutUrl ?? item.photoUrl}`}
              crossOrigin="use-credentials"
              alt={item.nickname || item.category.name}
              className="size-full object-contain p-1"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.nickname || item.category.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.category.path}
            {item.brand ? ` · ${item.brand.name}` : ""}
          </p>
        </div>
        {item.price != null && (
          <span className="shrink-0 text-sm text-muted-foreground">
            {currencySymbol(item.currency)}
            {item.price.toFixed(2)}
          </span>
        )}
      </Link>
      <ItemCardMenu item={item} triggerClassName="shrink-0" />
    </div>
  );
}
