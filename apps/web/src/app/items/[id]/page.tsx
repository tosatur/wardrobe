"use client";

import { use } from "react";
import { ItemDetailContent } from "@/components/item-detail-content";

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ItemDetailContent id={id} />
    </main>
  );
}
