"use client";

import { Button } from "@/components/ui/button";
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
    <div className={cn("flex gap-1", className)}>
      <Button
        type="button"
        size="sm"
        variant={showOriginal ? "outline" : "default"}
        className={cn(
          showOriginal && "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55",
        )}
        onClick={() => onChange(false)}
      >
        Cutout
      </Button>
      <Button
        type="button"
        size="sm"
        variant={showOriginal ? "default" : "outline"}
        className={cn(
          !showOriginal && "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55",
        )}
        onClick={() => onChange(true)}
      >
        Original
      </Button>
    </div>
  );
}
