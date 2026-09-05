"use client";

import { use } from "react";
import { ItemDetailContent } from "@/components/item-detail-content";
import { DetailPageShell } from "@/components/detail-page-shell";

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DetailPageShell>
      <ItemDetailContent id={id} backHref="/items" />
    </DetailPageShell>
  );
}
