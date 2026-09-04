"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/auth-client";
import { uploadAvatar } from "@/lib/users-client";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function AvatarUpload({
  currentImageUrl,
  name,
  onUploaded,
}: {
  currentImageUrl: string | null;
  name: string;
  onUploaded: (imageUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const { data, error } = await uploadAvatar(file);
    setUploading(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Profile picture updated.");
    if (data) onUploaded(data.image);
  }

  const displayUrl = preview ?? (currentImageUrl ? `${API_URL}${currentImageUrl}` : null);

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        {displayUrl && <AvatarImage src={displayUrl} crossOrigin="use-credentials" alt={name} />}
        <AvatarFallback className="text-base">{initials(name)}</AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Change photo"}
      </Button>
    </div>
  );
}
