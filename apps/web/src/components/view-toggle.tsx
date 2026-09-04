"use client";

import { Grid2x2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "masonry" | "grid" | "list";

const MODES: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: "masonry", label: "Masonry view", icon: LayoutGrid },
  { value: "grid", label: "Grid view", icon: Grid2x2 },
  { value: "list", label: "List view", icon: List },
];

export function ViewToggle({
  value,
  onChange,
  modes = ["masonry", "grid", "list"],
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  /** Which of the three modes to offer - outfit tiles are always square,
   *  so "masonry" (variable-height columns) has nothing to offer there. */
  modes?: ViewMode[];
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      {MODES.filter((m) => modes.includes(m.value)).map(({ value: mode, label, icon: Icon }) => (
        <Button
          key={mode}
          type="button"
          variant={value === mode ? "default" : "outline"}
          size="icon-sm"
          aria-label={label}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
