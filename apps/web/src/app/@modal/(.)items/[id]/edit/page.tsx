"use client";

import { use } from "react";
import { ItemEditContent } from "@/components/item-edit-content";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedEditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RouteModal title="Edit item" hideHeader showCloseButton={false}>
      <ItemEditContent id={id} />
    </RouteModal>
  );
}
