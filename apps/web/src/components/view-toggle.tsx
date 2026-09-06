"use client";

import { Grid2x2, LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "@/components/segmented-control";

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
    <SegmentedControl
      iconOnly
      value={value}
      onChange={onChange}
      className={className}
      options={MODES.filter((m) => modes.includes(m.value))}
    />
  );
}
