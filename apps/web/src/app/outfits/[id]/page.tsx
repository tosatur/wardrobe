"use client";

import { use } from "react";
import { OutfitDetailContent } from "@/components/outfit-detail-content";
import { DetailPageShell } from "@/components/detail-page-shell";

export default function OutfitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DetailPageShell>
      <OutfitDetailContent id={id} backHref="/outfits" />
    </DetailPageShell>
  );
}
