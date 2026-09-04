"use client";

import { SquircleIcon, SquircleDashedIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Small overlay control for switching an item photo frame between its
 * background-removed cutout (the default) and the original upload.
 * Only rendered by the caller when both actually exist - see
 * item-detail-content.tsx and photo-upload.tsx.
 */
export function PhotoViewToggle({
  showOriginal,
  onChange,
  className,
}: {
  showOriginal: boolean;
  onChange: (showOriginal: boolean) => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            pressed={showOriginal}
            onPressedChange={onChange}
            aria-label={showOriginal ? "Showing original photo" : "Showing cutout photo"}
            className={cn(
              "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55 hover:text-white data-[state=on]:bg-black/55 data-[state=on]:text-white",
              className,
            )}
          />
        }
      >
        {showOriginal ? <SquircleIcon /> : <SquircleDashedIcon />}
      </TooltipTrigger>
      <TooltipContent>{showOriginal ? "Original" : "Cutout"}</TooltipContent>
    </Tooltip>
  );
}
