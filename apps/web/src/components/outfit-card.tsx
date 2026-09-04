"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OutfitDto } from "@wardrobe/shared";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteOutfitDialog } from "@/components/delete-outfit-dialog";
import { logWear } from "@/lib/outfits-client";

export function OutfitCard({ outfit }: { outfit: OutfitDto }) {
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

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className="absolute right-2 bottom-2 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 data-popup-open:opacity-100"
              aria-label="Outfit actions"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
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
    </div>
  );
}
