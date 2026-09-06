"use client";

import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * A ButtonGroup of mutually-exclusive options, one selected at a time -
 * shared shape behind ViewToggle and ThemeToggle. `iconOnly` picks between
 * ViewToggle's icon-only-with-tooltip buttons and ThemeToggle's
 * icon-plus-label buttons; both are valid per DESIGN_SYSTEM.md's icon
 * conventions (an icon-only control always needs a tooltip, one with room
 * for a label doesn't).
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  iconOnly = false,
}: {
  /** Undefined shows no option as selected - e.g. next-themes' `theme`
   *  before the client has mounted and resolved a value. */
  value: T | undefined;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: ComponentType }[];
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <ButtonGroup className={className}>
      {options.map(({ value: option, label, icon: Icon }) => {
        const pressed = value === option;

        if (iconOnly) {
          return (
            <Tooltip key={option}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant={pressed ? "default" : "outline"}
                    size="icon-sm"
                    aria-label={label}
                    aria-pressed={pressed}
                    onClick={() => onChange(option)}
                  />
                }
              >
                <Icon />
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Button
            key={option}
            type="button"
            variant={pressed ? "default" : "outline"}
            size="sm"
            aria-pressed={pressed}
            onClick={() => onChange(option)}
          >
            <Icon />
            {label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
