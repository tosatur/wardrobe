"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/item-card";
import { ItemListRow } from "@/components/item-list-row";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { EmptyState } from "@/components/empty-state";
import { listItems } from "@/lib/items-client";
import { cn } from "@/lib/utils";

function isViewMode(value: string | null): value is ViewMode {
  return value === "masonry" || value === "grid" || value === "list";
}

export default function ItemArchivePage() {
  return (
    <Suspense fallback={null}>
      <ItemArchivePageContent />
    </Suspense>
  );
}

function ItemArchivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const rawView = searchParams.get("view");
  const view: ViewMode = isViewMode(rawView) ? rawView : "masonry";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/items/archive?${next.toString()}`);
  }

  const { data: items, isPending } = useQuery({
    queryKey: ["items", { q, status: "archived" }],
    queryFn: () => listItems({ q, status: "archived" }),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/items"
            className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" /> Back to closet
          </Link>
          <h1 className="font-heading text-3xl font-black tracking-tight uppercase">
            Archived items
          </h1>
        </div>
        <ViewToggle value={view} onChange={(next) => updateParam("view", next)} />
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="my-2 h-12 w-full" />
          ))}
        </div>
      )}
      {isPending && view !== "list" && (
        <div
          className={cn(
            view === "masonry"
              ? "columns-2 gap-4 sm:columns-3 md:columns-4"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("aspect-3/4 w-full", view === "masonry" && "mb-4 break-inside-avoid")}
            />
          ))}
        </div>
      )}

      {!isPending && items?.length === 0 && (
        <EmptyState>
          {q ? "No archived items match your search." : "You haven't archived any items."}
        </EmptyState>
      )}

      {!isPending && items && items.length > 0 && view === "list" && (
        <div className="glass p-3">
          {items.map((item) => (
            <ItemListRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {!isPending && items && items.length > 0 && view !== "list" && (
        <div
          className={cn(
            view === "masonry"
              ? "columns-2 gap-4 sm:columns-3 md:columns-4"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {items.map((item) => (
            <ItemCard key={item.id} item={item} variant={view} />
          ))}
        </div>
      )}
    </main>
  );
}
