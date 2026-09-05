"use client";

import { use } from "react";
import { ItemEditContent } from "@/components/item-edit-content";

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ItemEditContent id={id} backHref="/items" />
    </main>
  );
}
