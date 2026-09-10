"use client";

import { SquircleIcon, SquircleDashedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-pressed={showOriginal}
            aria-label={showOriginal ? "Showing original photo" : "Showing cutout photo"}
            onClick={() => onChange(!showOriginal)}
            className={cn(
              "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55",
              showOriginal && "bg-black/55",
              className,
            )}
          />
        }
      >
        {showOriginal ? <SquircleIcon /> : <SquircleDashedIcon />}
      </TooltipTrigger>
      <TooltipContent>{showOriginal ? "View cutout" : "View original"}</TooltipContent>
    </Tooltip>
  );
}
