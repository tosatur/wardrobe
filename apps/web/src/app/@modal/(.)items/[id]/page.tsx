"use client";

import { use } from "react";
import { ItemDetailContent } from "@/components/item-detail-content";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RouteModal title="Item details" hideHeader showCloseButton={false}>
      <ItemDetailContent id={id} />
    </RouteModal>
  );
}
