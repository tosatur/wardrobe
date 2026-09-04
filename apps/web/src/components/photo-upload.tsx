"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhotoViewToggle } from "@/components/photo-view-toggle";
import { API_URL } from "@/lib/auth-client";
import { uploadItemPhoto } from "@/lib/items-client";
import { useUploadStore } from "@/lib/upload-store";

export function PhotoUpload({
  itemId,
  currentPhotoUrl,
  currentPhotoCutoutUrl,
  onUploaded,
}: {
  itemId: string;
  currentPhotoUrl: string | null;
  currentPhotoCutoutUrl: string | null;
  onUploaded: (photoUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const uploading = useUploadStore((s) => s.uploading);
  const setUploading = useUploadStore((s) => s.setUploading);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const { data, error } = await uploadItemPhoto(itemId, file);
    setUploading(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Photo uploaded.");
    onUploaded(data?.photoUrl ?? null);
  }

  const chosenPhotoUrl = showOriginal
    ? (currentPhotoUrl ?? currentPhotoCutoutUrl)
    : (currentPhotoCutoutUrl ?? currentPhotoUrl);
  const displayUrl = preview ?? (chosenPhotoUrl ? `${API_URL}${chosenPhotoUrl}` : null);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-foreground/20 bg-muted p-3">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image
        <img
          src={displayUrl}
          crossOrigin="use-credentials"
          alt="Item photo"
          className="size-full object-contain"
        />
      ) : (
        <div className="flex size-full items-center justify-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
          No photo
        </div>
      )}
      {!preview && currentPhotoUrl && currentPhotoCutoutUrl && (
        <PhotoViewToggle
          showOriginal={showOriginal}
          onChange={setShowOriginal}
          className="absolute top-3 right-3"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      {/* Fixed dark glass rather than the theme-relative .glass utility,
          this floats over an arbitrary photo, not page background, so it
          needs to stay legible regardless of the site's own light/dark mode. */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55"
      >
        {uploading ? "Uploading…" : currentPhotoUrl ? "Replace photo" : "Upload photo"}
      </Button>
    </div>
  );
}
