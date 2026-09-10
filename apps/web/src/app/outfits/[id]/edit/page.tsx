"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OutfitBuilder } from "@/components/outfit-builder";
import { EmptyState } from "@/components/empty-state";
import { FullscreenLoadingOverlay } from "@/components/fullscreen-loading-overlay";
import { QueryError } from "@/components/query-error";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { getOutfit } from "@/lib/outfits-client";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";

export default function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    data: outfit,
    isError,
    isPending: isOutfitQueryPending,
    refetch,
  } = useQuery({
    queryKey: ["outfit", id],
    queryFn: () => getOutfit(id),
  });
  const isPending = useMinDurationPending(isOutfitQueryPending);
  const loadPlacements = useOutfitCanvasStore((s) => s.loadPlacements);

  useEffect(() => {
    if (outfit) loadPlacements(outfit.items);
  }, [outfit, loadPlacements]);

  if (isPending) {
    return <FullscreenLoadingOverlay label="Loading outfit…" />;
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <QueryError onRetry={() => void refetch()} className="py-12" />
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
    <main className="h-full">
      <OutfitBuilder outfit={outfit} />
    </main>
  );
}
