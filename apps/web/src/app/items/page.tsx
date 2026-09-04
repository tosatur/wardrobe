"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { CategoryPicker } from "@/components/category-picker";
import { ItemCard } from "@/components/item-card";
import { ItemListRow } from "@/components/item-list-row";
import { ItemSortSelect } from "@/components/item-sort-select";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { HoverReticle, type Rect } from "@/components/hover-reticle";
import { EmptyState } from "@/components/empty-state";
import { listBrands, listItems, listTags } from "@/lib/items-client";
import { sortItems, type ItemSortOrder } from "@/lib/sort-items";
import { cn } from "@/lib/utils";

function isViewMode(value: string | null): value is ViewMode {
  return value === "masonry" || value === "grid" || value === "list";
}

function isSortOrder(value: string | null): value is ItemSortOrder {
  return value === "newest" || value === "oldest" || value === "name-asc" || value === "name-desc";
}

function rectOf(el: HTMLElement): Rect {
  const { top, left, width, height } = el.getBoundingClientRect();
  return { top, left, width, height };
}

export default function ItemsPage() {
  return (
    <Suspense fallback={null}>
      <ItemsPageContent />
    </Suspense>
  );
}

function ItemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const brandId = searchParams.get("brandId") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const rawView = searchParams.get("view");
  const view: ViewMode = isViewMode(rawView) ? rawView : "masonry";
  const rawSort = searchParams.get("sort");
  const sort: ItemSortOrder = isSortOrder(rawSort) ? rawSort : "newest";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/items?${next.toString()}`);
  }

  const { data: items, isPending } = useQuery({
    queryKey: ["items", { q, categoryId, brandId, tag }],
    queryFn: () => listItems({ q, categoryId, brandId, tag }),
  });
  const sortedItems = sortItems(items ?? [], sort);

  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const brandOptions = (brands ?? []).map((b) => ({ value: b.id, label: b.name }));

  const hoveredElRef = useRef<HTMLElement | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);

  function handleHoverChange(el: HTMLElement | null) {
    if (el) {
      clearTimeout(clearTimer.current);
      hoveredElRef.current = el;
      setHoverRect(rectOf(el));
    } else {
      // Buffered so crossing the small gap between cards, where the mouse
      // is briefly over neither, doesn't commit "nothing hovered" and snap
      // the reticle out to its parked position before the next card's
      // mouseenter cancels it. Long enough to bridge that gap, short enough
      // to still feel immediate when genuinely leaving the grid.
      clearTimer.current = setTimeout(() => {
        hoveredElRef.current = null;
        setHoverRect(null);
      }, 120);
    }
  }

  // Keeps the reticle aligned with the hovered card across scroll/resize
  // instead of tracking a stale rect snapshot.
  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      if (hoveredElRef.current) setHoverRect(rectOf(hoveredElRef.current));
    }
    function onScrollOrResize() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden">
        <p
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-2 bg-linear-to-r from-foreground/25 to-foreground/5 bg-clip-text font-heading text-[7rem] leading-none font-black tracking-tighter text-transparent select-none sm:text-[9rem]"
        >
          CLOSET
        </p>
        <div className="relative flex items-center justify-between pt-2">
          <h1 className="font-heading text-3xl font-black tracking-tight uppercase">
            Your closet
          </h1>
          <div className="flex items-center gap-2">
            {/* A forced hard navigation, not Link: the (.)items/[id]
                interceptor treats any soft navigation to /items/* as an
                overlay on this page, and there's no item with id "archive"
                to show - see the analogous comment in outfits/page.tsx. */}
            <Button
              type="button"
              variant="outline"
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
              onClick={() => (window.location.href = "/items/archive")}
            >
              Archive
            </Button>
            <ViewToggle value={view} onChange={(next) => updateParam("view", next)} />
            <Button render={<Link href="/items/new" />}>+ Add item</Button>
          </div>
        </div>
      </div>

      <div className="glass mb-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-5">
        <Input
          placeholder="Search…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
        <CategoryPicker
          value={categoryId || null}
          onChange={(id) => updateParam("categoryId", id)}
        />
        <Combobox
          options={brandOptions}
          value={brandId || null}
          onChange={(id) => updateParam("brandId", id)}
          placeholder="Search brands…"
        />
        <Select
          value={tag || "all"}
          onValueChange={(v) => updateParam("tag", !v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags?.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ItemSortSelect
          value={sort}
          onChange={(next) => updateParam("sort", next)}
          className="w-full"
        />
      </div>

      {isPending && view === "list" && (
        <div className="glass divide-y divide-border p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="my-2 h-12 w-full" />
          ))}
        </div>
      )}
      {isPending && view !== "list" && (
        // CSS multi-column masonry for the masonry skeleton too - grid uses
        // an actual grid, since its cells are uniform.
        <div
          className={cn(
            view === "masonry"
              ? "columns-2 gap-4 sm:columns-3 md:columns-4"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("aspect-3/4 w-full", view === "masonry" && "mb-4 break-inside-avoid")}
            />
          ))}
        </div>
      )}

      {!isPending && sortedItems.length === 0 && (
        <EmptyState>No items match your filters.</EmptyState>
      )}

      {!isPending && sortedItems.length > 0 && view === "list" && (
        <div className="glass p-3">
          {sortedItems.map((item) => (
            <ItemListRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* CSS multi-column masonry for "masonry": cards flow down each
          column and wrap, sized to their own photo's aspect ratio rather
          than a shared row height. A real grid for "grid": every cell the
          same size. */}
      {!isPending && sortedItems.length > 0 && view !== "list" && (
        <div
          className={cn(
            view === "masonry"
              ? "columns-2 gap-4 sm:columns-3 md:columns-4"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {sortedItems.map((item) => (
            <ItemCard key={item.id} item={item} onHoverChange={handleHoverChange} variant={view} />
          ))}
        </div>
      )}

      <HoverReticle rect={hoverRect} />
    </main>
  );
}
