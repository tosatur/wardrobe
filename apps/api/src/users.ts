import type { FastifyInstance } from "fastify";
import { LocalStorageDriver, validateAndStripImage, InvalidImageError } from "@wardrobe/storage";
import { prisma } from "@wardrobe/db";
import { requireSession } from "./authorization.js";

const storageDir = process.env.STORAGE_DIR ?? "./.data/photos";
const storage = new LocalStorageDriver(storageDir);

export async function userRoutes(app: FastifyInstance) {
  app.post("/users/me/photo", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: "No photo uploaded." });
    }
    const buffer = await file.toBuffer();

    let processed;
    try {
      processed = await validateAndStripImage(buffer);
    } catch (error) {
      if (error instanceof InvalidImageError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }

    const { key } = await storage.save({
      buffer: processed.buffer,
      extension: processed.extension,
    });

    const existing = await prisma.user.findUnique({ where: { id: session.user.id } });
    const previousKey = existing?.avatarKey ?? null;

    const imageUrl = `/users/${session.user.id}/photo`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarKey: key, avatarMime: processed.mime, image: imageUrl },
    });

    if (previousKey) {
      await storage.delete(previousKey);
    }

    return reply.send({ image: imageUrl });
  });

  app.get<{ Params: { id: string } }>("/users/:id/photo", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const user = await prisma.user.findUnique({ where: { id: request.params.id } });
    if (!user?.avatarKey) {
      return reply.status(404).send({ error: "Photo not found." });
    }

    const buffer = await storage.read(user.avatarKey);
    reply.header("content-type", user.avatarMime ?? "application/octet-stream");
    reply.header("cache-control", "no-store");
    return reply.send(buffer);
  });
}
