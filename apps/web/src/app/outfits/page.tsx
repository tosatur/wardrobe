"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { listOutfits } from "@/lib/outfits-client";
import { useFrozenSearchParams } from "@/hooks/use-frozen-search-params";
import { useHoverReticle } from "@/hooks/use-hover-reticle";

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

  const { data: outfits, isPending } = useQuery({
    queryKey: ["outfits", { q }],
    queryFn: () => listOutfits({ q }),
  });

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
        <div className="glass divide-y divide-border p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="my-2 h-12 w-full" />
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

      {!isPending && outfits?.length === 0 && (
        <EmptyState>{q ? "No outfits match your search." : "No outfits yet."}</EmptyState>
      )}

      {!isPending && outfits && outfits.length > 0 && view === "list" && (
        <div className="glass p-3">
          {outfits.map((outfit) => (
            <OutfitListRow key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}

      {!isPending && outfits && outfits.length > 0 && view === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onHoverChange={handleHoverChange} />
          ))}
        </div>
      )}

      <HoverReticle rect={hoverRect} />
    </main>
  );
}
