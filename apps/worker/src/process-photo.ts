import { removeBackground } from "@imgly/background-removal-node";
import { createThumbnail, cropToContent } from "@wardrobe/storage";
import { prisma } from "@wardrobe/db";
import { storage } from "./storage.js";

export type PhotoJob = {
  itemId: string;
  photoOriginalKey: string;
};

async function deleteQuietly(key: string | null | undefined) {
  if (key) await storage.delete(key);
}

export async function processPhotoJob(data: PhotoJob): Promise<void> {
  const item = await prisma.item.findUnique({ where: { id: data.itemId } });
  if (!item || item.photoOriginalKey !== data.photoOriginalKey) {
    return;
  }

  try {
    const original = await storage.read(item.photoOriginalKey);
    // removeBackground identifies the image format from the Blob's `type`;
    // a bare Buffer/ArrayBuffer carries no MIME info and fails to decode.
    const originalBlob = new Blob([original], {
      type: item.photoOriginalMime ?? "image/jpeg",
    });
    const cutoutBlob = await removeBackground(originalBlob, { output: { format: "image/png" } });
    const cutoutBuffer = Buffer.from(await cutoutBlob.arrayBuffer());
    const croppedBuffer = await cropToContent(cutoutBuffer);
    const thumbnail = await createThumbnail(croppedBuffer);

    const { key: cutoutKey } = await storage.save({ buffer: croppedBuffer, extension: "png" });
    const { key: thumbnailKey } = await storage.save({
      buffer: thumbnail.buffer,
      extension: thumbnail.extension,
    });

    const current = await prisma.item.findUnique({ where: { id: data.itemId } });
    if (!current || current.photoOriginalKey !== data.photoOriginalKey) {
      // A newer photo was uploaded while this job was running, discard
      // these results rather than clobbering the newer upload's state.
      await deleteQuietly(cutoutKey);
      await deleteQuietly(thumbnailKey);
      return;
    }

    await prisma.item.update({
      where: { id: data.itemId },
      data: { photoCutoutKey: cutoutKey, photoThumbnailKey: thumbnailKey, photoStatus: "ready" },
    });
  } catch (error) {
    console.error(`Background removal failed for item ${data.itemId}:`, error);
    const current = await prisma.item.findUnique({ where: { id: data.itemId } });
    if (current && current.photoOriginalKey === data.photoOriginalKey) {
      await prisma.item.update({ where: { id: data.itemId }, data: { photoStatus: "failed" } });
    }
  }
}
