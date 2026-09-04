"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listWears } from "@/lib/outfits-client";
import { getWeather } from "@/lib/weather-client";
import { parseDateKey, toDateKey } from "@/lib/date";
import { weatherIcon, weatherLabel } from "@/lib/weather";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function DaySummaryContent({ date }: { date: string }) {
  const day = parseDateKey(date);

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

  const { data: wears, isPending: wearsPending } = useQuery({
    queryKey: ["wears", start, end],
    queryFn: () => listWears({ start, end }),
  });

  const { data: weatherDays, isPending: weatherPending } = useQuery({
    queryKey: ["weather", start, end],
    queryFn: () => getWeather({ start, end }),
  });

  if (wearsPending || weatherPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const dayWears = (wears ?? []).filter((wear) => toDateKey(new Date(wear.date)) === date);
  const weather = weatherDays?.find((w) => w.date === date);
  const Icon = weather ? weatherIcon(weather.weatherCode) : null;

  return (
    <div className="space-y-6">
      {weather && Icon && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* eslint-disable-next-line react-hooks/static-components -- weatherIcon selects a stable, statically-imported lucide icon, not one created during render */}
          <Icon className="size-4" />
          <span>
            {weatherLabel(weather.weatherCode)} · {Math.round(weather.tempMaxC)}°/
            {Math.round(weather.tempMinC)}°
          </span>
        </div>
      )}

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
                    thumbnail
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
  );
}
