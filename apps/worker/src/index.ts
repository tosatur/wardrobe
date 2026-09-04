import "dotenv/config";
import { prisma } from "@wardrobe/db";
import { processPhotoJob } from "./process-photo.js";

const POLL_INTERVAL_MS = 3000;

let stopped = false;

async function pollOnce() {
  const items = await prisma.item.findMany({
    where: { photoStatus: "processing" },
    select: { id: true, photoOriginalKey: true },
  });

  for (const item of items) {
    if (!item.photoOriginalKey) continue;
    await processPhotoJob({ itemId: item.id, photoOriginalKey: item.photoOriginalKey });
  }
}

async function loop() {
  while (!stopped) {
    try {
      await pollOnce();
    } catch (error) {
      console.error("Photo worker poll failed:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

console.log("Photo worker started.");
void loop();

function shutdown() {
  stopped = true;
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
