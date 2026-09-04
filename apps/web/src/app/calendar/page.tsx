"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listWears } from "@/lib/outfits-client";
import { CalendarWearTile } from "@/components/calendar-wear-tile";
import { DayWeather } from "@/components/day-weather";
import { getWeather } from "@/lib/weather-client";
import { toDateKey } from "@/lib/date";
import { useFrozenSearchParams } from "@/hooks/use-frozen-search-params";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// getDay() is Sun=0..Sat=6; shift so weeks are laid out Mon=0..Sun=6.
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

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

const MAX_VISIBLE_WEARS = 3;

// From two outfits onward, tiles sit in a fixed 2-column grid so the
// arrangement is deterministic rather than depending on flex-wrap fitting
// math: 2 wears fill one row, 3 wrap the third into a row of its own
// (centered under the gap above via col-span), and 4 (three outfits plus
// the overflow badge as the fourth tile) fill both rows as a 2x2 square.
// Two-up stays noticeably larger than the three-or-more density tier.
function wearTileColumnWidthClass(count: number) {
  return count === 2 ? "w-[90%]" : "w-[60%]";
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

  // The day-summary and outfit-detail modals are soft navigations to
  // /calendar/[date] and /outfits/[id], which change the URL - and drop its
  // ?month= query - out from under this still-mounted page (see the
  // matching hook used by the closet/outfits list pages). Without this, the
  // browsed month would snap back to the current real month behind the
  // modal, remounting the grid and replaying its mount animation.
  const searchParams = useFrozenSearchParams("/calendar");

  const month = parseMonthKey(searchParams.get("month"));
  const [direction, setDirection] = useState<"next" | "prev">("next");

  function goToMonth(next: Date) {
    setDirection(next > month ? "next" : "prev");
    router.replace(`/calendar?month=${toMonthKey(next)}`);
  }

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - mondayIndex(gridStart));
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - mondayIndex(gridEnd)));

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

  const todayKey = toDateKey(new Date());

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
        // Keyed by month so switching months mounts a fresh element - the
        // animate-in classes only play on mount, not on a prop update of
        // the same element.
        <div
          key={toMonthKey(monthStart)}
          className={cn(
            "glass grid grid-cols-7 gap-px overflow-hidden border border-foreground/10 animate-in fade-in-0 duration-300",
            direction === "next" ? "slide-in-from-right-8" : "slide-in-from-left-8",
          )}
        >
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
            const isToday = key === todayKey;
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
                    own `pointer-events-auto` opt-back-in) still capture their
                    own clicks and navigate to the outfit instead. The two
                    content rows below are pointer-events-none so they don't
                    shadow this link over their own (mostly empty) boxes. */}
                <Link
                  href={`/calendar/${key}`}
                  className="absolute inset-0"
                  aria-label={`View ${day.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}`}
                />
                <div className="pointer-events-none relative flex items-center justify-between">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isToday
                        ? "flex size-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <DayWeather weather={weatherByDay.get(key)} />
                </div>
                <div className="pointer-events-none relative flex flex-1 items-center justify-center">
                  {dayWears.length === 1 && (
                    <CalendarWearTile
                      wear={dayWears[0]}
                      className="pointer-events-auto block aspect-square w-[74%] overflow-hidden rounded-sm"
                    />
                  )}
                  {dayWears.length > 1 && (
                    <div className="grid w-full grid-cols-2 gap-1">
                      {dayWears.slice(0, MAX_VISIBLE_WEARS).map((wear, i) => {
                        // The triangle's apex (the 3rd tile when there's no
                        // 4th) spans both columns so it centers under the
                        // gap between the two tiles above it, rather than
                        // sitting left-aligned under the first column.
                        const isApex = dayWears.length === 3 && i === 2;
                        return (
                          <CalendarWearTile
                            key={wear.id}
                            wear={wear}
                            className={cn(
                              "pointer-events-auto mx-auto block aspect-square overflow-hidden rounded-sm",
                              isApex ? "col-span-2 w-[30%]" : wearTileColumnWidthClass(dayWears.length),
                            )}
                          />
                        );
                      })}
                      {dayWears.length > MAX_VISIBLE_WEARS && (
                        <span
                          className={cn(
                            "mx-auto flex aspect-square items-center justify-center rounded-sm border border-border bg-muted text-xs font-medium text-muted-foreground",
                            wearTileColumnWidthClass(dayWears.length),
                          )}
                        >
                          +{dayWears.length - MAX_VISIBLE_WEARS}
                        </span>
                      )}
                    </div>
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
