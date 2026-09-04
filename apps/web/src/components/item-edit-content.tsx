"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemForm } from "@/components/item-form";
import { EmptyState } from "@/components/empty-state";
import { getItem } from "@/lib/items-client";

export function ItemEditContent({ id }: { id: string }) {
  const { data: item, isPending } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItem(id),
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[5fr_7fr]">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <EmptyState className="py-12 text-center">Item not found.</EmptyState>;
  }

  return <ItemForm item={item} />;
}
