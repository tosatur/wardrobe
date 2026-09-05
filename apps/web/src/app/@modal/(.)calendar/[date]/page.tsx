"use client";

import { use } from "react";
import { DaySummaryContent } from "@/components/day-summary-content";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedCalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);

  return (
    <RouteModal title="Day summary" hideHeader showCloseButton={false} className="sm:max-w-md lg:max-w-md">
      <DaySummaryContent date={date} />
    </RouteModal>
  );
}
