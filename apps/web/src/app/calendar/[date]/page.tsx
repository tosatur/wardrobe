"use client";

import { use } from "react";
import { DaySummaryContent } from "@/components/day-summary-content";
import { parseDateKey } from "@/lib/date";

export default function CalendarDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const formatted = parseDateKey(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-black tracking-tight">{formatted}</h1>
      <DaySummaryContent date={date} />
    </main>
  );
}
