"use client";

import { use } from "react";
import { OutfitDetailContent } from "@/components/outfit-detail-content";

export default function OutfitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <OutfitDetailContent id={id} />
    </main>
  );
}
