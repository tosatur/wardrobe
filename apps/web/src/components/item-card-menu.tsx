"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import type { ItemDto } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteItemDialog } from "@/components/delete-item-dialog";
import { cn } from "@/lib/utils";

/**
 * The kebab menu (View/Edit/Use in new outfit/Delete) shared by every item
 * display variant - masonry and grid cards, and the list row.
 */
export function ItemCardMenu({ item, triggerClassName }: { item: ItemDto; triggerClassName?: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className={cn("rounded-full", triggerClassName)}
              aria-label="Item actions"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/items/${item.id}`} />}>View</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/items/${item.id}/edit`} />}>Edit</DropdownMenuItem>
          {item.photoStatus === "ready" && (
            // A forced hard navigation, not Link: see the comment on the
            // "+ Add outfit" button in outfits/page.tsx for why.
            <DropdownMenuItem
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
              onClick={() => (window.location.href = `/outfits/new?itemId=${item.id}`)}
            >
              Use in new outfit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteItemDialog itemId={item.id} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
