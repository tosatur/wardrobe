"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

/**
 * Renders in place of a query's content when it failed to load (`isError`),
 * distinct from a query resolving with legitimately empty or missing data.
 * Wraps the shared `EmptyState` copy with a retry action wired to the
 * query's own `refetch`.
 */
export function QueryError({
  onRetry,
  className,
  children = "Something went wrong loading this.",
}: {
  onRetry: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <EmptyState>{children}</EmptyState>
      <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
