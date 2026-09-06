"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ItemDto } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteEntityDialog } from "@/components/delete-entity-dialog";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";
import { deleteItem, updateItem } from "@/lib/items-client";
import { cn } from "@/lib/utils";

/**
 * The kebab menu (View/Edit/Use in new outfit/Archive/Delete) shared by
 * every item display variant - masonry and grid cards, and the list row.
 */
export function ItemCardMenu({ item, triggerClassName }: { item: ItemDto; triggerClassName?: string }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const archivingPending = useMinDurationPending(isArchiving);

  async function handleToggleArchived() {
    setIsArchiving(true);
    const nextStatus = item.status === "archived" ? "active" : "archived";
    const { error } = await updateItem(item.id, { status: nextStatus });
    setIsArchiving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(nextStatus === "archived" ? "Item archived." : "Item unarchived.");
    void queryClient.invalidateQueries({ queryKey: ["items"] });
    void queryClient.invalidateQueries({ queryKey: ["item", item.id] });
  }

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className={cn("rounded-full", triggerClassName)}
                    aria-label="Item actions"
                  />
                }
              />
            }
          >
            <EllipsisVertical />
          </TooltipTrigger>
          <TooltipContent>Item actions</TooltipContent>
        </Tooltip>
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
          <DropdownMenuItem disabled={archivingPending} onClick={() => void handleToggleArchived()}>
            {archivingPending
              ? item.status === "archived"
                ? "Unarchiving…"
                : "Archiving…"
              : item.status === "archived"
                ? "Unarchive"
                : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteEntityDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this item?"
        description="This permanently removes the item and its photo. This can't be undone."
        successMessage="Item deleted."
        invalidateQueryKey={["items"]}
        onDelete={() => deleteItem(item.id)}
      />
    </>
  );
}
