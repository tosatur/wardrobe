"use client";

import { useEffect } from "react";
import { OutfitBuilder } from "@/components/outfit-builder";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";

export default function NewOutfitPage() {
  const reset = useOutfitCanvasStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <main className="h-[calc(100vh-4rem)]">
      <OutfitBuilder />
    </main>
  );
}
