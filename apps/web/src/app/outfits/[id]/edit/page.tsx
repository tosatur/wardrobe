"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { OutfitBuilder } from "@/components/outfit-builder";
import { EmptyState } from "@/components/empty-state";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { getOutfit } from "@/lib/outfits-client";

export default function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: outfit, isPending } = useQuery({
    queryKey: ["outfit", id],
    queryFn: () => getOutfit(id),
  });
  const loadPlacements = useOutfitCanvasStore((s) => s.loadPlacements);

  useEffect(() => {
    if (outfit) loadPlacements(outfit.items);
  }, [outfit, loadPlacements]);

  if (isPending) {
    return (
      <main className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <Skeleton className="h-48 w-full shrink-0 lg:h-full lg:w-72" />
        <Skeleton className="min-h-96 flex-1" />
        <Skeleton className="h-48 w-full shrink-0 lg:h-full lg:w-80" />
      </main>
    );
  }

  if (!outfit) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <EmptyState className="py-12 text-center">Outfit not found.</EmptyState>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-4rem)]">
      <OutfitBuilder outfit={outfit} />
    </main>
  );
}
