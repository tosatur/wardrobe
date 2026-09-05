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
              // Matches the exact class list ui/button.tsx's "outline" variant
              // renders (including its dark: overrides) so this control looks
              // identical to PhotoUpload/PhotoPicker's "Replace photo" button -
              // Toggle's own variants don't carry that dark-mode styling, so
              // it has to be reproduced here rather than assumed to follow.
              "h-8 w-8 rounded-sm p-0 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55 hover:text-white dark:border-input/60 dark:bg-input/20 dark:hover:bg-input/40 data-[state=on]:bg-black/55 data-[state=on]:text-white dark:data-[state=on]:bg-input/40",
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
