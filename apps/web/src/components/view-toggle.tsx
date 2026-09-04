"use client";

import { Grid2x2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <ButtonGroup className={className}>
      {MODES.filter((m) => modes.includes(m.value)).map(({ value: mode, label, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={value === mode ? "default" : "outline"}
                size="icon-sm"
                aria-label={label}
                aria-pressed={value === mode}
                onClick={() => onChange(mode)}
              />
            }
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ButtonGroup>
  );
}
