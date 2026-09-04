"use client";

import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

// Stages a photo locally (no upload), for the create flow, where there's no
// item id yet to upload against. The parent uploads it once the item exists.
export function PhotoPicker({
  previewUrl,
  hasFile,
  onSelect,
}: {
  previewUrl: string | null;
  hasFile: boolean;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-foreground/20 bg-muted p-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
        <img src={previewUrl} alt="Selected photo" className="size-full object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
          No photo yet
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onSelect(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55"
      >
        {hasFile ? "Replace photo" : "Choose photo"}
      </Button>
    </div>
  );
}
