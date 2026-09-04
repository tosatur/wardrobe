"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Droplets, PlusIcon, Scissors, TriangleAlert, Wrench, Shirt, XIcon } from "lucide-react";
import type { ItemEventType } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AddItemEventDialog } from "@/components/add-item-event-dialog";
import { deleteItemEvent, listItemHistory } from "@/lib/items-client";

const EVENT_ICON: Record<ItemEventType, typeof Droplets> = {
  wash: Droplets,
  alteration: Scissors,
  damage: TriangleAlert,
  repair: Wrench,
};

const EVENT_LABEL: Record<ItemEventType, string> = {
  wash: "Washed",
  alteration: "Altered",
  damage: "Damaged",
  repair: "Repaired",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ItemHistoryTimeline({ itemId }: { itemId: string }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: entries, isPending } = useQuery({
    queryKey: ["item-history", itemId],
    queryFn: () => listItemHistory(itemId),
  });

  async function handleDelete(eventId: string) {
    const { error } = await deleteItemEvent(itemId, eventId);
    if (error) {
      toast.error(error);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["item-history", itemId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">History</p>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Log an event"
                onClick={() => setAddOpen(true)}
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent>Log an event</TooltipContent>
        </Tooltip>
      </div>

      {isPending && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isPending && entries?.length === 0 && (
        <p className="text-sm text-muted-foreground">No history yet.</p>
      )}

      {!isPending && entries && entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const Icon = entry.kind === "worn" ? Shirt : EVENT_ICON[entry.type];
            return (
              <li
                key={`${entry.kind}-${entry.id}`}
                className="flex items-start gap-3 border border-foreground/10 bg-muted px-3 py-2 text-sm"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {entry.kind === "worn" ? (
                      <>
                        Worn in{" "}
                        <Link href={`/outfits/${entry.outfitId}`} className="underline">
                          {entry.outfitName}
                        </Link>
                      </>
                    ) : (
                      EVENT_LABEL[entry.type]
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                  {entry.kind === "event" && entry.description && (
                    <p className="mt-1 text-muted-foreground">{entry.description}</p>
                  )}
                </div>
                {entry.kind === "event" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove event"
                    onClick={() => void handleDelete(entry.id)}
                  >
                    <XIcon />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddItemEventDialog itemId={itemId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
