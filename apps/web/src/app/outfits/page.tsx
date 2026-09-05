"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OutfitCard } from "@/components/outfit-card";
import { OutfitListRow } from "@/components/outfit-list-row";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { HoverReticle } from "@/components/hover-reticle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { listOutfits } from "@/lib/outfits-client";
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
  const searchParams = useFrozenSearchParams("/outfits");

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

  useEffect(() => {
    if (outfitsError && outfits) toast.error("Couldn't refresh results.");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fire when the error identity changes, not on every outfits update, so a lingering stale error doesn't re-toast on each successful background refetch
  }, [outfitsError]);

  const { hoverRect, handleHoverChange } = useHoverReticle();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
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
          <>
            <ViewToggle
              value={view}
              onChange={(next) => updateParam("view", next)}
              modes={["grid", "list"]}
            />
            <Button
              type="button"
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
              onClick={() => (window.location.href = "/outfits/new")}
            >
            <PlusIcon />
            Add outfit
            </Button>
          </>
        }
      />

      <div className="glass mb-6 p-3">
        <Input
          placeholder="Search…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
      </div>

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

      {!isPending && (!outfitsError || outfits) && outfits?.length === 0 && (
        <EmptyState>{q ? "No outfits match your search." : "No outfits yet."}</EmptyState>
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
    </main>
  );
}
