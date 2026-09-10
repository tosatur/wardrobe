"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listWears } from "@/lib/outfits-client";
import { getWeather } from "@/lib/weather-client";
import { parseDateKey, toDateKey } from "@/lib/date";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { DayWeather } from "@/components/day-weather";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityToolbar } from "@/components/entity-toolbar";

export function DaySummaryContent({ date, backHref }: { date: string; backHref?: string }) {
  const day = parseDateKey(date);
  // Title is derived purely from the date param, not the wears/weather
  // fetch, so the toolbar can render immediately instead of waiting behind
  // a skeleton like the other detail surfaces (which only know their title
  // once their own fetch resolves).
  const formatted = day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Padded a day on each side and re-bucketed below by local calendar day —
  // same reasoning as the calendar grid's own query: a wear's timestamp or
  // the server's UTC date boundary can otherwise fall just outside a
  // same-day range depending on the viewer's timezone offset.
  const queryStart = new Date(day);
  queryStart.setDate(queryStart.getDate() - 1);
  const queryEnd = new Date(day);
  queryEnd.setDate(queryEnd.getDate() + 1);
  const start = toDateKey(queryStart);
  const end = toDateKey(queryEnd);

  const {
    data: wears,
    isError: wearsError,
    isPending: wearsPending,
    refetch: refetchWears,
  } = useQuery({
    queryKey: ["wears", start, end],
    queryFn: () => listWears({ start, end }),
  });

  const { data: weatherDays, isPending: weatherPending } = useQuery({
    queryKey: ["weather", start, end],
    queryFn: () => getWeather({ start, end }),
  });

  const dayWears = (wears ?? []).filter((wear) => toDateKey(new Date(wear.date)) === date);
  const weather = weatherDays?.find((w) => w.date === date);

  return (
    <div className="flex flex-col gap-8">
      <EntityToolbar backHref={backHref} backLabel="Back to calendar" title={formatted} />

      {wearsPending || weatherPending ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : wearsError ? (
        <QueryError onRetry={() => void refetchWears()} className="py-8" />
      ) : (
        <div className="space-y-6">
          <DayWeather weather={weather} variant="detailed" />

          {dayWears.length === 0 ? (
            <EmptyState>No outfits logged.</EmptyState>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {dayWears.length} {dayWears.length === 1 ? "outfit" : "outfits"} logged
              </p>
              <div className="space-y-1">
                {dayWears.map((wear) => (
                  <Link
                    key={wear.id}
                    href={`/outfits/${wear.outfit.id}`}
                    className="flex items-center gap-3 rounded-sm p-1 transition-colors hover:bg-muted"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-sm">
                      <OutfitCanvas
                        readOnly
                        items={wear.outfit.items}
                        coverPhotoUrl={wear.outfit.coverPhotoUrl}
                      />
                    </div>
                    <span className="text-sm font-medium">{wear.outfit.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
