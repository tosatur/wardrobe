"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OutfitBuilder } from "@/components/outfit-builder";
import { FullscreenLoadingOverlay } from "@/components/fullscreen-loading-overlay";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { getItem } from "@/lib/items-client";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";

export default function NewOutfitPage() {
  return (
    <Suspense fallback={null}>
      <NewOutfitPageContent />
    </Suspense>
  );
}

function NewOutfitPageContent() {
  const searchParams = useSearchParams();
  const seedItemId = searchParams.get("itemId");
  const reset = useOutfitCanvasStore((s) => s.reset);
  const addPlacement = useOutfitCanvasStore((s) => s.addPlacement);
  const [isInitializing, setIsInitializing] = useState(true);
  const isPending = useMinDurationPending(isInitializing);

  useEffect(() => {
    reset();

    // "Use in new outfit" from an item's kebab menu links here with the
    // item's id, dropping it onto the canvas already placed.
    if (!seedItemId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no seed fetch to await; initializing completes immediately
      setIsInitializing(false);
      return;
    }
    let cancelled = false;
    void getItem(seedItemId).then((item) => {
      if (cancelled) return;
      if (item) {
        addPlacement(
          {
            id: item.id,
            nickname: item.nickname,
            categoryName: item.category.name,
            photoCutoutUrl: item.photoCutoutUrl,
            colors: item.colors,
            price: item.price,
            currency: item.currency,
          },
          50,
          50,
        );
      }
      setIsInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [seedItemId, reset, addPlacement]);

  if (isPending) {
    return <FullscreenLoadingOverlay label="Preparing outfit…" />;
  }

  return (
    <main className="h-full">
      <OutfitBuilder />
    </main>
  );
}
