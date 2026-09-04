"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OutfitCard } from "@/components/outfit-card";
import { OutfitListRow } from "@/components/outfit-list-row";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { EmptyState } from "@/components/empty-state";
import { listOutfits } from "@/lib/outfits-client";

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
  const searchParams = useSearchParams();
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden">
        <p
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-2 bg-linear-to-r from-foreground/25 to-foreground/5 bg-clip-text font-heading text-[7rem] leading-none font-black tracking-tighter text-transparent select-none sm:text-[9rem]"
        >
          OUTFITS
        </p>
        <div className="relative flex items-center justify-between pt-2">
          <h1 className="font-heading text-3xl font-black tracking-tight uppercase">
            Your outfits
          </h1>
          {/* A forced hard navigation, not next/link's Link: the
              (.)outfits/[id] interceptor treats any soft (client-side)
              navigation under /outfits/* as an overlay on the current page
              and never mounts the real target route, which would otherwise
              leave this page showing behind a blank modal slot instead of
              opening the outfit editor. */}
          <div className="flex items-center gap-2">
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
              + Add outfit
            </Button>
          </div>
        </div>
      </div>

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
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}
    </main>
  );
}
