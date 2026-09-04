"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listWears } from "@/lib/outfits-client";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { DayWeather } from "@/components/day-weather";
import { getWeather } from "@/lib/weather-client";
import { toDateKey } from "@/lib/date";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string | null): Date {
  if (key && /^\d{4}-\d{2}$/.test(key)) {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

const MAX_VISIBLE_WEARS = 4;

// Shown tiles get smaller as more outfits share a day, so a busy day still
// wraps into the cell instead of overflowing it.
function wearTileSizeClass(count: number) {
  if (count <= 1) return "size-16";
  if (count === 2) return "size-12";
  if (count <= MAX_VISIBLE_WEARS) return "size-10";
  return "size-8";
}

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageContent />
    </Suspense>
  );
}

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = parseMonthKey(searchParams.get("month"));

  function goToMonth(next: Date) {
    router.replace(`/calendar?month=${toMonthKey(next)}`);
  }

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // Padded a day on each side: the query boundaries are parsed as UTC
  // midnight server-side, so without padding a positive timezone offset
  // could exclude a wear that local-day bucketing (above) would still place
  // inside the visible grid.
  const queryStart = new Date(gridStart);
  queryStart.setDate(queryStart.getDate() - 1);
  const queryEnd = new Date(gridEnd);
  queryEnd.setDate(queryEnd.getDate() + 1);
  const start = toDateKey(queryStart);
  const end = toDateKey(queryEnd);

  const { data: wears, isPending } = useQuery({
    queryKey: ["wears", start, end],
    queryFn: () => listWears({ start, end }),
  });

  const { data: weatherDays } = useQuery({
    queryKey: ["weather", start, end],
    queryFn: () => getWeather({ start, end }),
  });

  const weatherByDay = new Map((weatherDays ?? []).map((w) => [w.date, w]));

  const wearsByDay = new Map<string, typeof wears>();
  for (const wear of wears ?? []) {
    const key = toDateKey(new Date(wear.date));
    const existing = wearsByDay.get(key) ?? [];
    existing.push(wear);
    wearsByDay.set(key, existing);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden">
        <p
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-2 bg-linear-to-r from-foreground/25 to-foreground/5 bg-clip-text font-heading text-[7rem] leading-none font-black tracking-tighter text-transparent select-none sm:text-[9rem]"
        >
          CALENDAR
        </p>
        <div className="relative flex items-center justify-between pt-2">
          <h1 className="font-heading text-3xl font-black tracking-tight uppercase">
            {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => goToMonth(addMonths(monthStart, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => goToMonth(addMonths(monthStart, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="glass grid grid-cols-7 gap-px overflow-hidden border border-foreground/10">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="bg-muted px-2 py-1.5 text-center font-mono text-[0.65rem] font-bold tracking-wider text-muted-foreground uppercase"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const key = toDateKey(day);
            const dayWears = wearsByDay.get(key) ?? [];
            const inMonth = day.getMonth() === monthStart.getMonth();
            return (
              <div
                key={key}
                className={cn(
                  "relative flex min-h-36 flex-col gap-1 bg-background p-1.5 transition-colors hover:bg-muted/60",
                  !inMonth && "bg-muted/40",
                )}
              >
                {/* Stretched link: fills the cell so the whole day is
                    clickable, while the outfit thumbnails below (given their
                    own `relative` stacking below) still capture their own
                    clicks and navigate to the outfit instead. */}
                <Link
                  href={`/calendar/${key}`}
                  className="absolute inset-0"
                  aria-label={`View ${day.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}`}
                />
                <div className="relative flex items-center justify-between">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      inMonth ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <DayWeather weather={weatherByDay.get(key)} />
                </div>
                <div className="relative flex flex-1 flex-wrap content-center items-center justify-center gap-1">
                  {dayWears.slice(0, MAX_VISIBLE_WEARS).map((wear) => (
                    <Link
                      key={wear.id}
                      href={`/outfits/${wear.outfit.id}`}
                      title={wear.outfit.name}
                      className={cn(
                        "block shrink-0 overflow-hidden rounded-sm",
                        wearTileSizeClass(dayWears.length),
                      )}
                    >
                      <OutfitCanvas readOnly items={wear.outfit.items} />
                    </Link>
                  ))}
                  {dayWears.length > MAX_VISIBLE_WEARS && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[0.65rem] font-medium text-muted-foreground",
                        wearTileSizeClass(dayWears.length),
                      )}
                    >
                      +{dayWears.length - MAX_VISIBLE_WEARS}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
