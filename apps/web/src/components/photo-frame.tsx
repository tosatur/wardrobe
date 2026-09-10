"use client";

import { useRef, type ChangeEvent, type ReactNode } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The aspect-square photo frame shared by PhotoPicker (local staging, no
 * item id yet) and PhotoUpload (uploads against an existing item): the
 * bordered frame, "no photo" placeholder + Upload button, the hidden file
 * input, and the dark-glass "Replace photo" button. Fixed dark glass rather
 * than the theme-relative .glass utility, since this floats over an
 * arbitrary photo, not page background, so it needs to stay legible
 * regardless of the site's own light/dark mode.
 */
export function PhotoFrame({
  photo,
  noPhotoLabel = "No photo",
  replaceLabel = "Replace photo",
  disabled,
  overlays,
  onFileSelected,
}: {
  /** The rendered photo (an `<img>`), or null/undefined when there isn't one yet. */
  photo: ReactNode;
  noPhotoLabel?: string;
  replaceLabel?: string;
  disabled?: boolean;
  /** Extra controls layered over the frame (view toggle, processing badge). */
  overlays?: ReactNode;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-foreground/20 bg-muted">
      {photo ?? (
        <div className="flex size-full flex-col items-center justify-center gap-3 p-3">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {noPhotoLabel}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon /> Upload
          </Button>
        </div>
      )}

      {overlays}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onFileSelected(e.target.files?.[0] ?? null)}
      />

      {photo && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                aria-label="Replace photo"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55"
              />
            }
          >
            <UploadIcon />
          </TooltipTrigger>
          <TooltipContent>{replaceLabel}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
