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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EntityToolbar } from "@/components/entity-toolbar";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { DeleteEntityDialog } from "@/components/delete-entity-dialog";
import { PhotoViewToggle } from "@/components/photo-view-toggle";
import { PhotoProcessingBadge } from "@/components/photo-processing-badge";
import { API_URL } from "@/lib/auth-client";
import { deleteItem, getItem, updateItem } from "@/lib/items-client";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";
import { currencySymbol } from "@wardrobe/shared";

export function ItemDetailContent({ id, backHref }: { id: string; backHref?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const archivingPending = useMinDurationPending(isArchiving);

  const {
    data: item,
    isError,
    isPending: isItemQueryPending,
    refetch,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItem(id),
    refetchInterval: (query) => (query.state.data?.photoStatus === "processing" ? 2000 : false),
  });
  const isPending = useMinDurationPending(isItemQueryPending);

  async function handleToggleArchived() {
    if (!item) return;
    setIsArchiving(true);
    const nextStatus = item.status === "archived" ? "active" : "archived";
    const { error } = await updateItem(id, { status: nextStatus });
    setIsArchiving(false);
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
      <div className="flex flex-col gap-8">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[5fr_7fr]">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <QueryError onRetry={() => void refetch()} className="py-12" />;
  }

  if (!item) {
    return <EmptyState className="py-12 text-center">Item not found.</EmptyState>;
  }

  const stats = item.stats;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
      <EntityToolbar
        backHref={backHref}
        backLabel="Back to closet"
        title={
          item.nickname ? (
            <>
              {item.nickname}{" "}
              <span className="font-normal text-muted-foreground">· {item.category.name}</span>
            </>
          ) : (
            item.category.name
          )
        }
        actions={
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
                    disabled={archivingPending}
                    onClick={() => void handleToggleArchived()}
                  />
                }
              >
                {archivingPending ? (
                  <Spinner />
                ) : item.status === "archived" ? (
                  <ArchiveRestoreIcon />
                ) : (
                  <ArchiveIcon />
                )}
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
        }
      />

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[5fr_7fr]">
        {/* The photo is the hero, its own frame, not tucked inside the info
            panel, so it reads as the main event, not an attachment. Read-only
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
          {item.photoStatus === "processing" && (
            <PhotoProcessingBadge className="absolute top-3 right-3" />
          )}
        </div>

        <div className="flex flex-col gap-6">
          {(item.brand?.name || item.size) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {item.brand?.name && (
                <div>
                  <p className="text-sm font-medium">Brand</p>
                  <p className="text-sm text-muted-foreground">{item.brand.name}</p>
                </div>
              )}
              {item.size && (
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm text-muted-foreground">{item.size}</p>
                </div>
              )}
            </div>
          )}

          {(item.materials.length > 0 || item.colors.length > 0) && (
            <div className="flex flex-col gap-4">
              <SectionEyebrow>Details</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {item.materials.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Materials</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.materials.map((material) => (
                        <Badge key={material.id} variant="outline">
                          {material.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.colors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Colors</p>
                    <div className="mt-1 flex flex-wrap gap-1">
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
              </div>
            </div>
          )}

          {stats && (
            <div className="flex flex-col gap-4">
              <SectionEyebrow>Stats</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Times worn</p>
                  <p className="text-sm text-muted-foreground">{stats.timesWorn}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last worn</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.lastWornDate
                      ? new Date(stats.lastWornDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
                {stats.costPerWear != null && (
                  <div>
                    <p className="text-sm font-medium">Cost per wear</p>
                    <p className="text-sm text-muted-foreground">
                      {currencySymbol(item.currency)}
                      {stats.costPerWear.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <SectionEyebrow>Organize</SectionEyebrow>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-sm text-muted-foreground capitalize">{item.visibility}</p>
              </div>
              {item.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Tags</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(item.purchaseDate || item.price != null) && (
            <div className="flex flex-col gap-4">
              <SectionEyebrow>Provenance</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {item.purchaseDate && (
                  <div>
                    <p className="text-sm font-medium">Purchase date</p>
                    <p className="text-sm text-muted-foreground">
                      {item.purchaseDate.slice(0, 10)}
                    </p>
                  </div>
                )}
                {item.price != null && (
                  <div>
                    <p className="text-sm font-medium">Price</p>
                    <p className="text-sm text-muted-foreground">
                      {currencySymbol(item.currency)}
                      {item.price.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.notes && (
            <div className="flex flex-col gap-4">
              <SectionEyebrow>Notes</SectionEyebrow>
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </div>
          )}
        </div>
      </div>

      <DeleteEntityDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/items")}
        title="Delete this item?"
        description="This permanently removes the item and its photo. This can't be undone."
        successMessage="Item deleted."
        invalidateQueryKey={["items"]}
        onDelete={() => deleteItem(id)}
      />
    </div>
  );
}
