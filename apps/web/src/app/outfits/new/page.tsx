"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OutfitBuilder } from "@/components/outfit-builder";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import { getItem } from "@/lib/items-client";

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

  useEffect(() => {
    reset();

    // "Use in new outfit" from an item's kebab menu links here with the
    // item's id, dropping it onto the canvas already placed.
    if (!seedItemId) return;
    let cancelled = false;
    void getItem(seedItemId).then((item) => {
      if (cancelled || !item) return;
      addPlacement(
        {
          id: item.id,
          nickname: item.nickname,
          categoryName: item.category.name,
          photoCutoutUrl: item.photoCutoutUrl,
        },
        50,
        50,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [seedItemId, reset, addPlacement]);

  return (
    <main className="h-[calc(100vh-4rem)]">
      <OutfitBuilder />
    </main>
  );
}
