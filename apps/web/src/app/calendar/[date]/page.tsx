"use client";

import { use } from "react";
import { DaySummaryContent } from "@/components/day-summary-content";
import { DetailPageShell } from "@/components/detail-page-shell";

export default function CalendarDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  return (
    <DetailPageShell className="sm:max-w-md lg:max-w-md">
      <DaySummaryContent date={date} backHref="/calendar" />
    </DetailPageShell>
  );
}
