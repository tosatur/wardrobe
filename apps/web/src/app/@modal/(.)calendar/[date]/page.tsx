"use client";

import { use } from "react";
import { DaySummaryContent } from "@/components/day-summary-content";
import { RouteModal } from "@/components/route-modal";
import { parseDateKey } from "@/lib/date";

export default function InterceptedCalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const formatted = parseDateKey(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <RouteModal title={formatted} className="sm:max-w-md lg:max-w-md">
      <DaySummaryContent date={date} />
    </RouteModal>
  );
}
