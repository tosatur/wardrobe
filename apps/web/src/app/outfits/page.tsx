"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OutfitCard } from "@/components/outfit-card";
import { EmptyState } from "@/components/empty-state";
import { listOutfits } from "@/lib/outfits-client";

export default function OutfitsPage() {
  return (
    <Suspense fallback={null}>
      <OutfitsPageContent />
    </Suspense>
  );
}

function OutfitsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/outfits?${next.toString()}`);
  }

  const { data: outfits, isPending } = useQuery({
    queryKey: ["outfits", { q }],
    queryFn: () => listOutfits({ q }),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden">
        <p
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-2 bg-linear-to-r from-foreground/25 to-foreground/5 bg-clip-text font-heading text-[7rem] leading-none font-black tracking-tighter text-transparent select-none sm:text-[9rem]"
        >
          OUTFITS
        </p>
        <div className="relative flex items-center justify-between pt-2">
          <h1 className="font-heading text-3xl font-black tracking-tight uppercase">
            Your outfits
          </h1>
          <Button render={<Link href="/outfits/new" />}>+ Add outfit</Button>
        </div>
      </div>

      <div className="glass mb-6 p-3">
        <Input
          placeholder="Search…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
      </div>

      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}

      {!isPending && outfits?.length === 0 && (
        <EmptyState>{q ? "No outfits match your search." : "No outfits yet."}</EmptyState>
      )}

      {!isPending && outfits && outfits.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}
    </main>
  );
}
