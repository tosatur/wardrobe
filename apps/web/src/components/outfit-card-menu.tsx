"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OutfitDto } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteOutfitDialog } from "@/components/delete-outfit-dialog";
import { logWear } from "@/lib/outfits-client";
import { cn } from "@/lib/utils";

/**
 * The kebab menu (View/Edit/Log today/Delete) shared by every outfit
 * display variant - the grid card and the list row.
 */
export function OutfitCardMenu({
  outfit,
  triggerClassName,
}: {
  outfit: OutfitDto;
  triggerClassName?: string;
}) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleLogToday() {
    const { error } = await logWear(outfit.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Logged today's wear.");
    void queryClient.invalidateQueries({ queryKey: ["outfits"] });
    void queryClient.invalidateQueries({ queryKey: ["outfit", outfit.id] });
    void queryClient.invalidateQueries({ queryKey: ["wears"] });
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
                    aria-label="Outfit actions"
                  />
                }
              />
            }
          >
            <EllipsisVertical />
          </TooltipTrigger>
          <TooltipContent>Outfit actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/outfits/${outfit.id}`} />}>View</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/outfits/${outfit.id}/edit`} />}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleLogToday()}>Log today</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteOutfitDialog outfitId={outfit.id} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
