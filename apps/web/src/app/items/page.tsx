"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArchiveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiCombobox } from "@/components/combobox";
import { CategoryMultiPicker } from "@/components/category-multi-picker";
import { ItemCard } from "@/components/item-card";
import { ItemListRow } from "@/components/item-list-row";
import { ItemSortSelect } from "@/components/item-sort-select";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { HoverReticle } from "@/components/hover-reticle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listBrands, listItems, listTags } from "@/lib/items-client";
import { sortItems, type ItemSortOrder } from "@/lib/sort-items";
import { useFrozenSearchParams } from "@/hooks/use-frozen-search-params";
import { useHoverReticle } from "@/hooks/use-hover-reticle";
import { cn } from "@/lib/utils";

function isViewMode(value: string | null): value is ViewMode {
  return value === "masonry" || value === "grid" || value === "list";
}

function isSortOrder(value: string | null): value is ItemSortOrder {
  return value === "newest" || value === "oldest" || value === "name-asc" || value === "name-desc";
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
  const searchParams = useFrozenSearchParams("/items");

  const q = searchParams.get("q") ?? "";
  const categoryIds = searchParams.get("categoryIds")?.split(",").filter(Boolean) ?? [];
  const brandIds = searchParams.get("brandIds")?.split(",").filter(Boolean) ?? [];
  const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
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

  function updateListParam(key: string, values: string[]) {
    updateParam(key, values.join(","));
  }

  const { data: items, isPending } = useQuery({
    queryKey: ["items", { q, categoryIds, brandIds, tags: selectedTags }],
    queryFn: () => listItems({ q, categoryIds, brandIds, tags: selectedTags }),
  });
  const sortedItems = sortItems(items ?? [], sort);

  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const brandOptions = (brands ?? []).map((b) => ({ value: b.id, label: b.name }));
  const tagOptions = (tags ?? []).map((t) => ({ value: t, label: t }));

  const { hoverRect, handleHoverChange } = useHoverReticle();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Your closet"
        watermark="Closet"
        actions={
          <>
            {/* A forced hard navigation, not Link: the (.)items/[id]
                interceptor treats any soft navigation to /items/* as an
                overlay on this page, and there's no item with id "archive"
                to show - see the analogous comment in outfits/page.tsx. */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Archived items"
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard nav, see comment above
                    onClick={() => (window.location.href = "/items/archive")}
                  />
                }
              >
                <ArchiveIcon />
              </TooltipTrigger>
              <TooltipContent>Archived items</TooltipContent>
            </Tooltip>
            <ViewToggle value={view} onChange={(next) => updateParam("view", next)} />
            <Button render={<Link href="/items/new" />}>+ Add item</Button>
          </>
        }
      />

      <div className="glass mb-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-5">
        <Input
          placeholder="Search…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
        <CategoryMultiPicker
          values={categoryIds}
          onChange={(ids) => updateListParam("categoryIds", ids)}
        />
        <MultiCombobox
          options={brandOptions}
          values={brandIds}
          onChange={(ids) => updateListParam("brandIds", ids)}
          placeholder="Search brands…"
          emptyText="No matching brand."
          showAllBeforeSearch={false}
        />
        <MultiCombobox
          options={tagOptions}
          values={selectedTags}
          onChange={(next) => updateListParam("tags", next)}
          placeholder="Search tags…"
          emptyText="No matching tag."
          showAllBeforeSearch={false}
        />
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
