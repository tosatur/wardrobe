"use client";

import { useMemo, useState } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { ItemDto } from "@wardrobe/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { CategoryPicker } from "@/components/category-picker";
import { API_URL } from "@/lib/auth-client";
import { listItems } from "@/lib/items-client";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { cn } from "@/lib/utils";

type SortOrder = "newest" | "oldest" | "name-asc" | "name-desc";

function sortItems(items: ItemDto[], order: SortOrder): ItemDto[] {
  const sorted = [...items];
  const label = (item: ItemDto) => item.nickname ?? item.category.name;
  switch (order) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "name-asc":
      return sorted.sort((a, b) => label(a).localeCompare(label(b)));
    case "name-desc":
      return sorted.sort((a, b) => label(b).localeCompare(label(a)));
  }
}

function PaletteTile({ item, disabled }: { item: ItemDto; disabled: boolean }) {
  const [tileWidth, setTileWidth] = useState<number | null>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: {
      type: "palette",
      item: {
        id: item.id,
        nickname: item.nickname,
        categoryName: item.category.name,
        photoCutoutUrl: item.photoCutoutUrl,
      },
      tileWidth,
    },
    disabled,
  });

  function setRefs(node: HTMLDivElement | null) {
    setNodeRef(node);
    if (node && tileWidth === null) setTileWidth(node.getBoundingClientRect().width);
  }

  if (!item.photoCutoutUrl) return null;

  return (
    <div
      ref={setRefs}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      className={cn(
        "group relative mb-3 block touch-none break-inside-avoid transition-opacity duration-150",
        disabled && "opacity-30",
        !disabled && isDragging && "opacity-40",
        !disabled && !isDragging && "cursor-grab active:cursor-grabbing",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image; natural aspect ratio so the masonry rows vary by photo shape */}
      <img
        src={`${API_URL}${item.photoCutoutUrl}`}
        crossOrigin="use-credentials"
        alt={item.nickname ?? item.category.name}
        className="pointer-events-none block h-auto w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate p-2 font-mono text-[0.65rem] tracking-wide text-white uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {item.nickname ?? item.category.name}
      </p>
    </div>
  );
}

export function ItemPalette() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("newest");

  const { data: items, isPending } = useQuery({
    queryKey: ["items", { photoStatus: "ready", q, categoryId }],
    queryFn: () =>
      listItems({
        photoStatus: "ready",
        q: q || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  const placements = useOutfitCanvasStore((s) => s.placements);
  const placedIds = useMemo(() => new Set(placements.map((p) => p.itemId)), [placements]);
  const sortedItems = useMemo(() => sortItems(items ?? [], sort), [items, sort]);

  const { active } = useDndContext();
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: "item-palette" });
  const showDropZone = active?.data.current?.type === "placed";

  return (
    <div ref={setDropRef} className="relative flex h-full flex-col gap-3">
      {/* Kept mounted (rather than conditionally rendered) so the
          opacity change is a transition, not an instant mount/unmount. */}
      <div
        aria-hidden={!showDropZone}
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 backdrop-blur-sm opacity-0 transition-opacity duration-200",
          showDropZone && "opacity-100",
          isOver && "bg-destructive/20",
        )}
      >
        <Trash2 className={cn("size-8", isOver ? "text-destructive" : "text-muted-foreground")} />
        <p className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Drop to remove
        </p>
      </div>

      <p className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Your items
      </p>

      <div className="flex flex-col gap-2">
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <CategoryPicker value={categoryId || null} onChange={setCategoryId} />
        <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className="columns-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 aspect-3/4 w-full break-inside-avoid" />
          ))}
        </div>
      )}

      {!isPending && sortedItems.length === 0 && (
        <EmptyState>
          {q || categoryId ? "No items match." : "No items with a processed photo yet."}
        </EmptyState>
      )}

      {!isPending && sortedItems.length > 0 && (
        <div className="columns-2 gap-3">
          {sortedItems.map((item) => (
            <PaletteTile key={item.id} item={item} disabled={placedIds.has(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
