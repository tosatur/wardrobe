"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { PhotoStatus } from "@wardrobe/shared";
import { PhotoCrossfade } from "@/components/photo-crossfade";
import { PhotoFrame } from "@/components/photo-frame";
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
  const [preview, setPreview] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const uploading = useUploadStore((s) => s.uploading);
  const setUploading = useUploadStore((s) => s.setUploading);
  const queryClient = useQueryClient();

  async function handleFileSelected(file: File | null) {
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

  return (
    <PhotoFrame
      disabled={uploading}
      replaceLabel={uploading ? "Uploading…" : "Replace photo"}
      onFileSelected={(file) => void handleFileSelected(file)}
      photo={
        preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, not an authenticated remote image
          <img src={preview} alt="Item photo" className="size-full object-contain" />
        ) : (
          <PhotoCrossfade
            originalSrc={currentPhotoUrl ? `${API_URL}${currentPhotoUrl}` : null}
            cutoutSrc={currentPhotoCutoutUrl ? `${API_URL}${currentPhotoCutoutUrl}` : null}
            showOriginal={showOriginal}
            alt="Item photo"
          />
        )
      }
      overlays={
        <>
          {!preview && currentPhotoUrl && currentPhotoCutoutUrl && (
            <PhotoViewToggle
              showOriginal={showOriginal}
              onChange={setShowOriginal}
              className="absolute right-3 bottom-3"
            />
          )}
          {photoStatus === "processing" && <PhotoProcessingBadge className="absolute top-3 right-3" />}
        </>
      }
    />
  );
}
