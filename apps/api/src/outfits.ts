import type { FastifyInstance } from "fastify";
import {
  OutfitCreateSchema,
  OutfitUpdateSchema,
  OutfitQuerySchema,
  WearCreateSchema,
  type OutfitDto,
  type OutfitItemDto,
} from "@wardrobe/shared";
import { LocalStorageDriver, validateAndStripImage, InvalidImageError } from "@wardrobe/storage";
import { prisma, Prisma } from "@wardrobe/db";
import { requireSession, canModify } from "./authorization.js";

const storageDir = process.env.STORAGE_DIR ?? "./.data/photos";
const storage = new LocalStorageDriver(storageDir);

const OUTFIT_INCLUDE = {
  items: {
    include: {
      item: { include: { category: true, colors: { include: { color: true } } } },
    },
  },
  tags: { include: { tag: true } },
  wears: { orderBy: { wornDate: "desc" } },
} as const;

type OutfitWithRelations = Prisma.OutfitGetPayload<{ include: typeof OUTFIT_INCLUDE }>;

class BadRequestError extends Error {}

type OutfitItemWithItem = OutfitWithRelations["items"][number];

export function toOutfitItemDto(oi: OutfitItemWithItem): OutfitItemDto {
  return {
    itemId: oi.itemId,
    x: oi.x,
    y: oi.y,
    zIndex: oi.zIndex,
    scale: oi.scale,
    rotation: oi.rotation,
    flipX: oi.flipX,
    item: {
      id: oi.item.id,
      nickname: oi.item.nickname,
      categoryName: oi.item.category.name,
      photoCutoutUrl: oi.item.photoCutoutKey ? `/items/${oi.item.id}/photo/cutout` : null,
      colors: oi.item.colors.map((ic) => ({
        id: ic.color.id,
        name: ic.color.name,
        hex: ic.color.hex,
      })),
      price: oi.item.price === null ? null : Number(oi.item.price),
      currency: oi.item.currency,
    },
  };
}

export function toOutfitDto(outfit: OutfitWithRelations): OutfitDto {
  return {
    id: outfit.id,
    ownerId: outfit.ownerId,
    name: outfit.name,
    description: outfit.description,
    coverPhotoUrl: outfit.coverPhotoKey ? `/outfits/${outfit.id}/photo/cover` : null,
    rating: outfit.rating,
    items: outfit.items.map(toOutfitItemDto),
    tags: outfit.tags.map((ot) => ot.tag.name),
    wornDates: outfit.wears.map((w) => ({ id: w.id, date: w.wornDate.toISOString() })),
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString(),
  };
}

async function validateItemPlacements(
  tx: Prisma.TransactionClient,
  ownerId: string,
  placements: { itemId: string }[],
) {
  const itemIds = placements.map((p) => p.itemId);
  if (new Set(itemIds).size !== itemIds.length) {
    throw new BadRequestError("An item can only be placed once per outfit.");
  }
  if (itemIds.length === 0) return;

  const count = await tx.item.count({
    where: { id: { in: itemIds }, ownerId, photoStatus: "ready" },
  });
  if (count !== itemIds.length) {
    throw new BadRequestError("One or more items are unavailable for outfits.");
  }
}

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

async function upsertTags(tx: Prisma.TransactionClient, names: string[]) {
  const normalized = [...new Set(names.map((n) => n.toLowerCase()))];
  return Promise.all(
    normalized.map((name) => tx.tag.upsert({ where: { name }, create: { name }, update: {} })),
  );
}

export async function outfitRoutes(app: FastifyInstance) {
  app.post("/outfits", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = OutfitCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const { items: placements, tags: tagNames, wornDates, ...data } = parsed.data;

    try {
      const outfit = await prisma.$transaction(async (tx) => {
        await validateItemPlacements(tx, session.user.id, placements);
        const tags = await upsertTags(tx, tagNames);

        return tx.outfit.create({
          data: {
            ...data,
            ownerId: session.user.id,
            items: {
              create: placements.map((p) => ({
                itemId: p.itemId,
                x: p.x,
                y: p.y,
                zIndex: p.zIndex,
                scale: p.scale,
                rotation: p.rotation,
                flipX: p.flipX,
              })),
            },
            tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
            wears: { create: wornDates.map((wornDate) => ({ wornDate })) },
          },
          include: OUTFIT_INCLUDE,
        });
      });

      return reply.status(201).send(toOutfitDto(outfit));
    } catch (error) {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/outfits", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = OutfitQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query parameters." });
    }
    const { q } = parsed.data;

    const outfits = await prisma.outfit.findMany({
      where: {
        ownerId: session.user.id,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: OUTFIT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return reply.send(outfits.map(toOutfitDto));
  });

  app.get<{ Params: { id: string } }>("/outfits/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const outfit = await prisma.outfit.findUnique({
      where: { id: request.params.id },
      include: OUTFIT_INCLUDE,
    });

    if (!outfit || !canModify(outfit, session.user.id)) {
      return reply.status(404).send({ error: "Outfit not found." });
    }

    return reply.send(toOutfitDto(outfit));
  });

  app.patch<{ Params: { id: string } }>("/outfits/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.outfit.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Outfit not found." });
    }

    const parsed = OutfitUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const { items: placements, tags: tagNames, wornDates, ...data } = parsed.data;

    try {
      const outfit = await prisma.$transaction(async (tx) => {
        if (placements !== undefined) {
          await validateItemPlacements(tx, session.user.id, placements);
          await tx.outfitItem.deleteMany({ where: { outfitId: existing.id } });
          await tx.outfit.update({
            where: { id: existing.id },
            data: {
              items: {
                create: placements.map((p) => ({
                  itemId: p.itemId,
                  x: p.x,
                  y: p.y,
                  zIndex: p.zIndex,
                  scale: p.scale,
                  rotation: p.rotation,
                })),
              },
              // The generated cover photo reflects a specific set of
              // placements, so clearing the canvas invalidates it - a fresh
              // one is only produced client-side once items are placed again.
              ...(placements.length === 0 && existing.coverPhotoKey
                ? { coverPhotoKey: null }
                : {}),
            },
          });
          if (placements.length === 0 && existing.coverPhotoKey) {
            await storage.delete(existing.coverPhotoKey);
          }
        }

        if (tagNames !== undefined) {
          await tx.outfitTag.deleteMany({ where: { outfitId: existing.id } });
          const tags = await upsertTags(tx, tagNames);
          await tx.outfit.update({
            where: { id: existing.id },
            data: { tags: { create: tags.map((tag) => ({ tagId: tag.id })) } },
          });
        }

        if (wornDates !== undefined) {
          await tx.outfitWear.deleteMany({ where: { outfitId: existing.id } });
          await tx.outfit.update({
            where: { id: existing.id },
            data: { wears: { create: wornDates.map((wornDate) => ({ wornDate })) } },
          });
        }

        return tx.outfit.update({
          where: { id: existing.id },
          data,
          include: OUTFIT_INCLUDE,
        });
      });

      return reply.send(toOutfitDto(outfit));
    } catch (error) {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post<{ Params: { id: string } }>("/outfits/:id/wears", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.outfit.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Outfit not found." });
    }

    const parsed = WearCreateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    }

    const wornDate = parsed.data.date ?? new Date();
    const { start, end } = dayRange(wornDate);
    const alreadyLogged = await prisma.outfitWear.findFirst({
      where: { outfitId: existing.id, wornDate: { gte: start, lt: end } },
    });
    if (alreadyLogged) {
      return reply.status(409).send({ error: "This outfit is already logged for that day." });
    }

    const outfit = await prisma.outfit.update({
      where: { id: existing.id },
      data: { wears: { create: [{ wornDate }] } },
      include: OUTFIT_INCLUDE,
    });

    return reply.status(201).send(toOutfitDto(outfit));
  });

  app.delete<{ Params: { id: string } }>("/outfits/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.outfit.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Outfit not found." });
    }

    await prisma.outfit.delete({ where: { id: existing.id } });

    if (existing.coverPhotoKey) {
      await storage.delete(existing.coverPhotoKey);
    }

    return reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>("/outfits/:id/photo", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.outfit.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Outfit not found." });
    }

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
    const previousKey = existing.coverPhotoKey;

    const outfit = await prisma.outfit.update({
      where: { id: existing.id },
      data: { coverPhotoKey: key },
      include: OUTFIT_INCLUDE,
    });

    if (previousKey) {
      await storage.delete(previousKey);
    }

    return reply.send(toOutfitDto(outfit));
  });

  app.get<{ Params: { id: string } }>("/outfits/:id/photo/cover", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const outfit = await prisma.outfit.findUnique({ where: { id: request.params.id } });
    if (!outfit || !canModify(outfit, session.user.id) || !outfit.coverPhotoKey) {
      return reply.status(404).send({ error: "Photo not found." });
    }

    const buffer = await storage.read(outfit.coverPhotoKey);
    reply.header("content-type", "image/png");
    reply.header("cache-control", "no-store");
    return reply.send(buffer);
  });
}
