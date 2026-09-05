"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EntityToolbar } from "@/components/entity-toolbar";
import { StarRating } from "@/components/star-rating";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitAnalysis } from "@/components/outfit-analysis";
import { EmptyState } from "@/components/empty-state";
import { deleteOutfit, getOutfit, logWear } from "@/lib/outfits-client";

export function OutfitDetailContent({ id, backHref }: { id: string; backHref?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: outfit, isPending } = useQuery({
    queryKey: ["outfit", id],
    queryFn: () => getOutfit(id),
  });

  async function handleDelete() {
    const { error } = await deleteOutfit(id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Outfit deleted.");
    void queryClient.invalidateQueries({ queryKey: ["outfits"] });
    router.push("/outfits");
  }

  async function handleLogToday() {
    const { error } = await logWear(id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Logged today's wear.");
    void queryClient.invalidateQueries({ queryKey: ["outfit", id] });
    void queryClient.invalidateQueries({ queryKey: ["outfits"] });
    void queryClient.invalidateQueries({ queryKey: ["wears"] });
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-6 lg:grid-cols-[7fr_5fr]">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!outfit) {
    return <EmptyState className="py-12 text-center">Outfit not found.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-8">
      <EntityToolbar
        backHref={backHref}
        backLabel="Back to outfits"
        title={outfit.name}
        actions={
          <ButtonGroup>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Log today"
                    onClick={() => void handleLogToday()}
                  />
                }
              >
                <CalendarPlusIcon />
              </TooltipTrigger>
              <TooltipContent>Log today</TooltipContent>
            </Tooltip>
            {/* Replace, not push: same reasoning as ItemDetailContent's Edit
                link - swapping to the edit view of the same outfit shouldn't
                grow the back-stack. */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edit outfit"
                    render={<Link href={`/outfits/${id}/edit`} replace />}
                  />
                }
              >
                <PencilIcon />
              </TooltipTrigger>
              <TooltipContent>Edit outfit</TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger
                  render={<AlertDialogTrigger render={<Button variant="destructive" size="icon" aria-label="Delete outfit" />} />}
                >
                  <Trash2Icon />
                </TooltipTrigger>
                <TooltipContent>Delete outfit</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this outfit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the outfit. This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ButtonGroup>
        }
      />

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-6 pb-6 lg:grid-cols-[7fr_5fr]">
        <OutfitCanvas readOnly items={outfit.items} coverPhotoUrl={outfit.coverPhotoUrl} />

        <Card className="h-fit">
          <CardContent className="space-y-6">
            {outfit.description && <p className="text-sm">{outfit.description}</p>}

            {outfit.rating != null && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Rating</p>
                <StarRating value={outfit.rating} readOnly />
              </div>
            )}

            {outfit.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {outfit.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {outfit.wornDates.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Worn {outfit.wornDates.length} {outfit.wornDates.length === 1 ? "time" : "times"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {outfit.wornDates.map((w) => (
                    <Badge key={w.id} variant="outline">
                      {new Date(w.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <OutfitAnalysis items={outfit.items.map((oi) => oi.item)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
