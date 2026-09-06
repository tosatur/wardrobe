"use client";

import { PhotoFrame } from "@/components/photo-frame";

// Stages a photo locally (no upload), for the create flow, where there's no
// item id yet to upload against. The parent uploads it once the item exists.
export function PhotoPicker({
  previewUrl,
  onSelect,
}: {
  previewUrl: string | null;
  onSelect: (file: File | null) => void;
}) {
  return (
    <PhotoFrame
      noPhotoLabel="No photo yet"
      onFileSelected={onSelect}
      photo={
        previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={previewUrl} alt="Selected photo" className="size-full object-contain" />
        )
      }
    />
  );
}
