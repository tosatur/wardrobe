import { API_URL } from "@/lib/auth-client";

const COVER_SIZE = 1000;

type CoverPlacement = {
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  photoCutoutUrl: string | null;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "use-credentials";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Flattens the outfit canvas into a single PNG, mirroring the same
 * percentage-based x/y, w-1/3 base width, scale, and rotation math the live
 * canvas uses (see CanvasItem/OutfitCanvas), so the exported image matches
 * what was actually arranged.
 */
export async function composeOutfitCover(placements: CoverPlacement[]): Promise<Blob | null> {
  const withPhotos = placements.filter((p) => p.photoCutoutUrl);
  if (withPhotos.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = COVER_SIZE;
  canvas.height = COVER_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sorted = [...withPhotos].sort((a, b) => a.zIndex - b.zIndex);

  try {
    for (const p of sorted) {
      const img = await loadImage(`${API_URL}${p.photoCutoutUrl}`);
      const width = (COVER_SIZE / 3) * p.scale;
      const height = width * (img.naturalHeight / img.naturalWidth);

      ctx.save();
      ctx.translate((p.x / 100) * COVER_SIZE, (p.y / 100) * COVER_SIZE);
      ctx.rotate((p.rotation * Math.PI) / 180);
      if (p.flipX) ctx.scale(-1, 1);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    }
  } catch {
    return null;
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
