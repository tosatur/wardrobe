"use client";

import { use } from "react";
import { OutfitDetailContent } from "@/components/outfit-detail-content";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedOutfitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RouteModal title="Outfit details" hideHeader>
      <OutfitDetailContent id={id} />
    </RouteModal>
  );
}
