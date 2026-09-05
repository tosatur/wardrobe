"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { PhotoStatus } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PhotoViewToggle } from "@/components/photo-view-toggle";
import { PhotoProcessingBadge } from "@/components/photo-processing-badge";
import { API_URL } from "@/lib/auth-client";
import { uploadItemPhoto } from "@/lib/items-client";
import { useUploadStore } from "@/lib/upload-store";

export function PhotoUpload({
  itemId,
  currentPhotoUrl,
  currentPhotoCutoutUrl,
  photoStatus,
  onUploaded,
}: {
  itemId: string;
  currentPhotoUrl: string | null;
  currentPhotoCutoutUrl: string | null;
  photoStatus: PhotoStatus;
  onUploaded: (photoUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const uploading = useUploadStore((s) => s.uploading);
  const setUploading = useUploadStore((s) => s.setUploading);
  const queryClient = useQueryClient();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    const { data, error } = await uploadItemPhoto(itemId, file);
    setUploading(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Photo uploaded.");
    // Seeds the item query with the fresh (still "processing") record right
    // away, rather than waiting on a refetch - item-edit-content's own
    // refetchInterval takes over from here and polls until the worker
    // swaps in the finished cutout. The local preview is dropped once the
    // server has its own copy to show, so that swap-in is actually visible
    // instead of being masked behind the blob URL forever.
    if (data) {
      queryClient.setQueryData(["item", itemId], data);
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    }
    URL.revokeObjectURL(objectUrl);
    setPreview(null);
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
        <div className="flex size-full flex-col items-center justify-center gap-3">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            No photo
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon /> Upload
          </Button>
        </div>
      )}
      {!preview && currentPhotoUrl && currentPhotoCutoutUrl && (
        <PhotoViewToggle
          showOriginal={showOriginal}
          onChange={setShowOriginal}
          className="absolute right-3 bottom-3"
        />
      )}
      {photoStatus === "processing" && <PhotoProcessingBadge className="absolute top-3 right-3" />}
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
      {displayUrl && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploading}
                aria-label="Replace photo"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/55"
              />
            }
          >
            <UploadIcon />
          </TooltipTrigger>
          <TooltipContent>{uploading ? "Uploading…" : "Replace photo"}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
