"use client";

import { use } from "react";
import { ItemEditContent } from "@/components/item-edit-content";
import { DetailPageShell } from "@/components/detail-page-shell";

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DetailPageShell>
      <ItemEditContent id={id} backHref="/items" />
    </DetailPageShell>
  );
}
