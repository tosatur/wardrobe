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
import { HoverReticle, type Rect } from "@/components/hover-reticle";
import { EmptyState } from "@/components/empty-state";
import { listBrands, listItems, listTags } from "@/lib/items-client";

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
          <Button render={<Link href="/items/new" />}>+ Add item</Button>
        </div>
      </div>

      <div className="glass mb-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
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
          <SelectTrigger>
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
      </div>

      {/* CSS multi-column masonry. No library needed. Cards flow down each
          column and wrap, sized to their own photo's aspect ratio rather
          than a shared row height. */}
      {isPending && (
        <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 aspect-3/4 w-full break-inside-avoid" />
          ))}
        </div>
      )}

      {!isPending && items?.length === 0 && (
        <EmptyState>No items match your filters.</EmptyState>
      )}

      {!isPending && items && items.length > 0 && (
        <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onHoverChange={handleHoverChange} />
          ))}
        </div>
      )}

      <HoverReticle rect={hoverRect} />
    </main>
  );
}
