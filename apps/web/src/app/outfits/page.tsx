"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { OutfitCard } from "@/components/outfit-card";
import { OutfitListRow } from "@/components/outfit-list-row";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { HoverReticle } from "@/components/hover-reticle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { listOutfits } from "@/lib/outfits-client";
import { listItems } from "@/lib/items-client";
import { useFrozenSearchParams } from "@/hooks/use-frozen-search-params";
import { useHoverReticle } from "@/hooks/use-hover-reticle";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";
import { cn } from "@/lib/utils";

function isOutfitViewMode(value: string | null): value is "grid" | "list" {
  return value === "grid" || value === "list";
}

export default function OutfitsPage() {
  return (
    <Suspense fallback={null}>
      <OutfitsPageContent />
    </Suspense>
  );
}

function OutfitsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useFrozenSearchParams("/outfits");
  const [isCheckingItems, setIsCheckingItems] = useState(false);
  const [noItemsDialogOpen, setNoItemsDialogOpen] = useState(false);

  // Building an outfit needs at least one item on the canvas, so check
  // before opening the (empty) builder rather than after. Fetched fresh on
  // every click instead of cached in state, since an item could have been
  // added or archived since the last check.
  async function handleAddOutfit() {
    setIsCheckingItems(true);
    try {
      const items = await queryClient.fetchQuery({
        queryKey: ["items", "outfit-gate"],
        queryFn: () => listItems(),
      });
      if (items.length === 0) {
        setNoItemsDialogOpen(true);
      } else {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
        window.location.href = "/outfits/new";
      }
    } catch {
      // Couldn't tell either way - don't block outfit creation on it.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
      window.location.href = "/outfits/new";
    } finally {
      setIsCheckingItems(false);
    }
  }

  const q = searchParams.get("q") ?? "";
  const rawView = searchParams.get("view");
  const view: ViewMode = isOutfitViewMode(rawView) ? rawView : "grid";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/outfits?${next.toString()}`);
  }

  const {
    data: outfits,
    error: outfitsError,
    isPending: isOutfitsQueryPending,
    isFetching: isOutfitsFetching,
    refetch: refetchOutfits,
  } = useQuery({
    queryKey: ["outfits", { q }],
    queryFn: () => listOutfits({ q }),
    placeholderData: keepPreviousData,
  });
  const isPending = useMinDurationPending(isOutfitsQueryPending);
  const isOutfitsEmpty = !isPending && (!outfitsError || outfits) && outfits?.length === 0 && !q;

  useEffect(() => {
    if (outfitsError && outfits) toast.error("Couldn't refresh results.");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fire when the error identity changes, not on every outfits update, so a lingering stale error doesn't re-toast on each successful background refetch
  }, [outfitsError]);

  const { hoverRect, handleHoverChange } = useHoverReticle();

  return (
    <main className="mx-auto flex h-full max-w-6xl flex-col px-4 py-8">
      <PageHeader
        title="Your outfits"
        watermark="Outfits"
        actions={
          /* A forced hard navigation, not next/link's Link: the
             (.)outfits/[id] interceptor treats any soft (client-side)
             navigation under /outfits/* as an overlay on the current page
             and never mounts the real target route, which would otherwise
             leave this page showing behind a blank modal slot instead of
             opening the outfit editor. */
          !isOutfitsEmpty && (
            <>
              <ViewToggle
                value={view}
                onChange={(next) => updateParam("view", next)}
                modes={["grid", "list"]}
              />
              <Button type="button" disabled={isCheckingItems} onClick={() => void handleAddOutfit()}>
                <PlusIcon />
                Add outfit
              </Button>
            </>
          )
        }
      />

      {!isOutfitsEmpty && (
        <div className="glass mb-6 p-3">
          <Input
            placeholder="Search…"
            defaultValue={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>
      )}

      {isPending && view === "list" && (
        <div className="glass p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-2 last:border-b-0">
              <Skeleton className="size-12 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}
      {isPending && view === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}

      {!isPending && outfitsError && !outfits && (
        <QueryError onRetry={() => void refetchOutfits()} className="py-12" />
      )}

      {isOutfitsEmpty && (
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SparklesIcon />
              </EmptyMedia>
              <EmptyTitle>You haven&apos;t created any outfits yet</EmptyTitle>
              <EmptyDescription>
                Put together items from your closet to build your first look.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" disabled={isCheckingItems} onClick={() => void handleAddOutfit()}>
                <PlusIcon />
                Create outfit
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {!isPending && (!outfitsError || outfits) && outfits?.length === 0 && q && (
        <EmptyState>No outfits match your search.</EmptyState>
      )}

      {!isPending && (!outfitsError || outfits) && outfits && outfits.length > 0 && view === "list" && (
        <div
          className={cn(
            "glass p-3 animate-in fade-in-0 duration-200 motion-reduce:animate-none",
            isOutfitsFetching && "opacity-60 transition-opacity motion-reduce:transition-none",
          )}
        >
          {outfits.map((outfit) => (
            <OutfitListRow key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}

      {!isPending && (!outfitsError || outfits) && outfits && outfits.length > 0 && view === "grid" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 animate-in fade-in-0 duration-200 motion-reduce:animate-none",
            isOutfitsFetching && "opacity-60 transition-opacity motion-reduce:transition-none",
          )}
        >
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onHoverChange={handleHoverChange} />
          ))}
        </div>
      )}

      <HoverReticle rect={hoverRect} />

      <AlertDialog open={noItemsDialogOpen} onOpenChange={setNoItemsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add an item first?</AlertDialogTitle>
            <AlertDialogDescription>
              You don&apos;t have any items in your closet yet. Add one before building an outfit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction render={<Link href="/items/new" />}>Add item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
