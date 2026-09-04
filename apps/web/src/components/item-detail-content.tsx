"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteItemDialog } from "@/components/delete-item-dialog";
import { PhotoViewToggle } from "@/components/photo-view-toggle";
import { ItemHistoryTimeline } from "@/components/item-history-timeline";
import { API_URL } from "@/lib/auth-client";
import { getItem, updateItem } from "@/lib/items-client";
import { EmptyState } from "@/components/empty-state";
import { currencySymbol } from "@wardrobe/shared";

export function ItemDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const { data: item, isPending } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItem(id),
    refetchInterval: (query) => (query.state.data?.photoStatus === "processing" ? 2000 : false),
  });

  async function handleToggleArchived() {
    if (!item) return;
    const nextStatus = item.status === "archived" ? "active" : "archived";
    const { error } = await updateItem(id, { status: nextStatus });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(nextStatus === "archived" ? "Item archived." : "Item unarchived.");
    void queryClient.invalidateQueries({ queryKey: ["item", id] });
    void queryClient.invalidateQueries({ queryKey: ["items"] });
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[7fr_5fr]">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-2/3" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <EmptyState className="py-12 text-center">Item not found.</EmptyState>;
  }

  const details: [string, string | number | null][] = [
    ["Brand", item.brand?.name ?? null],
    ["Size", item.size],
    ["Price", item.price != null ? `${currencySymbol(item.currency)}${item.price.toFixed(2)}` : null],
    ["Purchase date", item.purchaseDate?.slice(0, 10) ?? null],
    ["Visibility", item.visibility],
  ];

  const stats = item.stats;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[7fr_5fr]">
        {/* The photo is the hero, its own frame, not tucked inside the info
            card, so it reads as the main event, not an attachment. Read-only
            here; replacing the photo is an edit-page action. */}
        <div className="relative aspect-square w-full overflow-hidden border border-foreground/20 bg-muted p-3">
          {item.photoCutoutUrl || item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
            <img
              src={`${API_URL}${showOriginal ? (item.photoUrl ?? item.photoCutoutUrl) : (item.photoCutoutUrl ?? item.photoUrl)}`}
              crossOrigin="use-credentials"
              alt="Item photo"
              className="size-full object-contain"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
              No photo
            </div>
          )}
          {item.photoCutoutUrl && item.photoUrl && (
            <PhotoViewToggle
              showOriginal={showOriginal}
              onChange={setShowOriginal}
              className="absolute right-3 bottom-3"
            />
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{item.nickname || item.category.name}</CardTitle>
              {item.nickname && (
                <p className="text-sm text-muted-foreground">{item.category.name}</p>
              )}
            </div>
            <ButtonGroup>
              {/* Replace, not push: swapping to the edit view of the same
                  item shouldn't grow the back-stack, so closing the modal
                  after a save returns straight to whatever opened this view
                  instead of stepping back through the edit screen. */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit item"
                      render={<Link href={`/items/${id}/edit`} replace />}
                    />
                  }
                >
                  <PencilIcon />
                </TooltipTrigger>
                <TooltipContent>Edit item</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={item.status === "archived" ? "Unarchive item" : "Archive item"}
                      onClick={() => void handleToggleArchived()}
                    />
                  }
                >
                  {item.status === "archived" ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                </TooltipTrigger>
                <TooltipContent>
                  {item.status === "archived" ? "Unarchive item" : "Archive item"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label="Delete item"
                      onClick={() => setDeleteOpen(true)}
                    />
                  }
                >
                  <Trash2Icon />
                </TooltipTrigger>
                <TooltipContent>Delete item</TooltipContent>
              </Tooltip>
            </ButtonGroup>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {details
                .filter(([, value]) => value != null)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="capitalize">{value}</dd>
                  </div>
                ))}
            </dl>

            {stats && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Stats</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Times worn</dt>
                    <dd>{stats.timesWorn}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last worn</dt>
                    <dd>
                      {stats.lastWornDate
                        ? new Date(stats.lastWornDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Never"}
                    </dd>
                  </div>
                  {stats.costPerWear != null && (
                    <div>
                      <dt className="text-muted-foreground">Cost per wear</dt>
                      <dd>
                        {currencySymbol(item.currency)}
                        {stats.costPerWear.toFixed(2)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {item.colors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Colors</p>
                <div className="flex flex-wrap gap-1">
                  {item.colors.map((color) => (
                    <Badge key={color.id} variant="outline" className="gap-1.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full border"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {item.materials.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Materials</p>
                <div className="flex flex-wrap gap-1">
                  {item.materials.map((material) => (
                    <Badge key={material.id} variant="outline">
                      {material.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {item.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {item.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ItemHistoryTimeline itemId={id} />

      <DeleteItemDialog
        itemId={id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/items")}
      />
    </div>
  );
}
