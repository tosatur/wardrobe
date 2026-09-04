import type { FastifyInstance } from "fastify";
import {
  ItemCreateSchema,
  ItemUpdateSchema,
  ItemQuerySchema,
  type ItemDto,
  type ItemStatsDto,
} from "@wardrobe/shared";
import { LocalStorageDriver, validateAndStripImage, InvalidImageError } from "@wardrobe/storage";
import { prisma, Prisma } from "@wardrobe/db";
import { requireSession, canView, canModify } from "./authorization.js";

const storageDir = process.env.STORAGE_DIR ?? "./.data/photos";
const storage = new LocalStorageDriver(storageDir);

const ITEM_INCLUDE = {
  tags: { include: { tag: true } },
  category: { include: { parent: true } },
  brand: true,
  colors: { include: { color: true } },
  materials: { include: { material: true } },
} as const;

type ItemWithRelations = Prisma.ItemGetPayload<{ include: typeof ITEM_INCLUDE }>;

class BadRequestError extends Error {}

function categoryPath(category: { name: string; parent: { name: string } | null }) {
  return category.parent ? `${category.parent.name}/${category.name}` : category.name;
}

export function computeItemStats(wornDates: Date[], price: number | null): ItemStatsDto {
  const timesWorn = wornDates.length;
  const lastWornDate =
    timesWorn === 0
      ? null
      : wornDates.reduce((latest, d) => (d > latest ? d : latest)).toISOString();
  const costPerWear = price != null && timesWorn > 0 ? price / timesWorn : null;

  return { timesWorn, lastWornDate, costPerWear };
}

export function toItemDto(item: ItemWithRelations, stats: ItemStatsDto | null = null): ItemDto {
  return {
    id: item.id,
    ownerId: item.ownerId,
    nickname: item.nickname,
    category: {
      id: item.category.id,
      name: item.category.name,
      parentName: item.category.parent?.name ?? null,
      path: categoryPath(item.category),
    },
    brand: item.brand ? { id: item.brand.id, name: item.brand.name } : null,
    colors: item.colors.map((ic) => ({ id: ic.color.id, name: ic.color.name, hex: ic.color.hex })),
    materials: item.materials.map((im) => ({ id: im.material.id, name: im.material.name })),
    size: item.size,
    purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString() : null,
    price: item.price === null ? null : Number(item.price),
    currency: item.currency,
    notes: item.notes,
    photoUrl: item.photoOriginalKey ? `/items/${item.id}/photo/original` : null,
    photoCutoutUrl: item.photoCutoutKey ? `/items/${item.id}/photo/cutout` : null,
    photoThumbnailUrl: item.photoThumbnailKey ? `/items/${item.id}/photo/thumbnail` : null,
    photoStatus: item.photoStatus,
    visibility: item.visibility,
    status: item.status,
    tags: item.tags.map((it) => it.tag.name),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    stats,
  };
}

async function upsertTags(tx: Prisma.TransactionClient, names: string[]) {
  const normalized = [...new Set(names.map((n) => n.toLowerCase()))];
  return Promise.all(
    normalized.map((name) => tx.tag.upsert({ where: { name }, create: { name }, update: {} })),
  );
}

async function findOrCreateBrand(tx: Prisma.TransactionClient, name: string) {
  const existing = await tx.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;
  return tx.brand.create({ data: { name } });
}

async function validateReferences(
  tx: Prisma.TransactionClient,
  input: { categoryId?: string; colorIds?: string[]; materialIds?: string[] },
) {
  if (input.categoryId !== undefined) {
    const category = await tx.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new BadRequestError("Unknown category.");
  }
  if (input.colorIds && input.colorIds.length > 0) {
    const count = await tx.color.count({ where: { id: { in: input.colorIds } } });
    if (count !== input.colorIds.length) throw new BadRequestError("One or more colors not found.");
  }
  if (input.materialIds && input.materialIds.length > 0) {
    const count = await tx.material.count({ where: { id: { in: input.materialIds } } });
    if (count !== input.materialIds.length) {
      throw new BadRequestError("One or more materials not found.");
    }
  }
}

export async function itemRoutes(app: FastifyInstance) {
  app.post("/items", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = ItemCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const { tags: tagNames, colorIds, materialIds, brandName, categoryId, ...data } = parsed.data;

    try {
      const item = await prisma.$transaction(async (tx) => {
        await validateReferences(tx, { categoryId, colorIds, materialIds });

        const tags = await upsertTags(tx, tagNames);
        const brand = brandName ? await findOrCreateBrand(tx, brandName) : null;

        return tx.item.create({
          data: {
            ...data,
            categoryId,
            brandId: brand?.id,
            ownerId: session.user.id,
            tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
            colors: { create: colorIds.map((colorId) => ({ colorId })) },
            materials: { create: materialIds.map((materialId) => ({ materialId })) },
          },
          include: ITEM_INCLUDE,
        });
      });

      return reply.status(201).send(toItemDto(item));
    } catch (error) {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/items", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = ItemQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query parameters." });
    }
    const { categoryId, colorId, brandId, materialId, tag, q, photoStatus, status } = parsed.data;

    // Archived items stay out of the closet, search, and outfit-builder
    // palette unless a caller explicitly asks for them (the archive page).
    const conditions: Prisma.ItemWhereInput[] = [
      { ownerId: session.user.id },
      { status: status ?? "active" },
    ];
    if (categoryId) {
      conditions.push({ OR: [{ categoryId }, { category: { parentId: categoryId } }] });
    }
    if (colorId) conditions.push({ colors: { some: { colorId } } });
    if (brandId) conditions.push({ brandId });
    if (materialId) conditions.push({ materials: { some: { materialId } } });
    if (tag) conditions.push({ tags: { some: { tag: { name: tag.toLowerCase() } } } });
    if (photoStatus) conditions.push({ photoStatus });
    if (q) {
      conditions.push({
        OR: [
          { nickname: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
          { category: { parent: { name: { contains: q, mode: "insensitive" } } } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const items = await prisma.item.findMany({
      where: { AND: conditions },
      include: ITEM_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return reply.send(items.map((item) => toItemDto(item)));
  });

  app.get<{ Params: { id: string } }>("/items/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const item = await prisma.item.findUnique({
      where: { id: request.params.id },
      include: ITEM_INCLUDE,
    });

    if (!item || !canView(item, session.user.id)) {
      return reply.status(404).send({ error: "Item not found." });
    }

    const wears = await prisma.outfitWear.findMany({
      where: { outfit: { items: { some: { itemId: item.id } } } },
      select: { wornDate: true },
    });
    const stats = computeItemStats(
      wears.map((w) => w.wornDate),
      item.price === null ? null : Number(item.price),
    );

    return reply.send(toItemDto(item, stats));
  });

  app.patch<{ Params: { id: string } }>("/items/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Item not found." });
    }

    const parsed = ItemUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const { tags: tagNames, colorIds, materialIds, brandName, categoryId, ...data } = parsed.data;

    try {
      const item = await prisma.$transaction(async (tx) => {
        await validateReferences(tx, { categoryId, colorIds, materialIds });

        if (tagNames !== undefined) {
          await tx.itemTag.deleteMany({ where: { itemId: existing.id } });
          const tags = await upsertTags(tx, tagNames);
          await tx.item.update({
            where: { id: existing.id },
            data: { tags: { create: tags.map((tag) => ({ tagId: tag.id })) } },
          });
        }
        if (colorIds !== undefined) {
          await tx.itemColor.deleteMany({ where: { itemId: existing.id } });
          await tx.item.update({
            where: { id: existing.id },
            data: { colors: { create: colorIds.map((colorId) => ({ colorId })) } },
          });
        }
        if (materialIds !== undefined) {
          await tx.itemMaterial.deleteMany({ where: { itemId: existing.id } });
          await tx.item.update({
            where: { id: existing.id },
            data: { materials: { create: materialIds.map((materialId) => ({ materialId })) } },
          });
        }

        let brandId: string | undefined;
        if (brandName !== undefined) {
          const brand = await findOrCreateBrand(tx, brandName);
          brandId = brand.id;
        }

        return tx.item.update({
          where: { id: existing.id },
          data: {
            ...data,
            ...(categoryId !== undefined ? { categoryId } : {}),
            ...(brandId !== undefined ? { brandId } : {}),
          },
          include: ITEM_INCLUDE,
        });
      });

      return reply.send(toItemDto(item));
    } catch (error) {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>("/items/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Item not found." });
    }

    await prisma.item.delete({ where: { id: existing.id } });
    if (existing.photoOriginalKey) {
      await storage.delete(existing.photoOriginalKey);
    }
    if (existing.photoCutoutKey) {
      await storage.delete(existing.photoCutoutKey);
    }
    if (existing.photoThumbnailKey) {
      await storage.delete(existing.photoThumbnailKey);
    }

    return reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>("/items/:id/photo", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const existing = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!existing || !canModify(existing, session.user.id)) {
      return reply.status(404).send({ error: "Item not found." });
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
    const previousKey = existing.photoOriginalKey;
    const previousCutoutKey = existing.photoCutoutKey;
    const previousThumbnailKey = existing.photoThumbnailKey;

    const updated = await prisma.item.update({
      where: { id: existing.id },
      data: {
        photoOriginalKey: key,
        photoOriginalMime: processed.mime,
        photoCutoutKey: null,
        photoThumbnailKey: null,
        photoStatus: "processing",
      },
      include: ITEM_INCLUDE,
    });

    if (previousKey) {
      await storage.delete(previousKey);
    }
    if (previousCutoutKey) {
      await storage.delete(previousCutoutKey);
    }
    if (previousThumbnailKey) {
      await storage.delete(previousThumbnailKey);
    }

    return reply.send(toItemDto(updated));
  });

  app.get<{ Params: { id: string } }>("/items/:id/photo/original", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const item = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!item || !canView(item, session.user.id) || !item.photoOriginalKey) {
      return reply.status(404).send({ error: "Photo not found." });
    }

    const buffer = await storage.read(item.photoOriginalKey);
    reply.header("content-type", item.photoOriginalMime ?? "application/octet-stream");
    // The URL is stable per item even though a re-upload swaps the
    // underlying file, so caches must always revalidate.
    reply.header("cache-control", "no-store");
    return reply.send(buffer);
  });

  app.get<{ Params: { id: string } }>("/items/:id/photo/cutout", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const item = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!item || !canView(item, session.user.id) || !item.photoCutoutKey) {
      return reply.status(404).send({ error: "Photo not found." });
    }

    const buffer = await storage.read(item.photoCutoutKey);
    reply.header("content-type", "image/png");
    reply.header("cache-control", "no-store");
    return reply.send(buffer);
  });

  app.get<{ Params: { id: string } }>("/items/:id/photo/thumbnail", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const item = await prisma.item.findUnique({ where: { id: request.params.id } });
    if (!item || !canView(item, session.user.id) || !item.photoThumbnailKey) {
      return reply.status(404).send({ error: "Photo not found." });
    }

    const buffer = await storage.read(item.photoThumbnailKey);
    reply.header("content-type", "image/webp");
    reply.header("cache-control", "no-store");
    return reply.send(buffer);
  });

  app.get("/tags", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return reply.send(tags.map((t) => t.name));
  });

  app.get("/colors", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const colors = await prisma.color.findMany({ orderBy: { name: "asc" } });
    return reply.send(colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex })));
  });

  app.get("/materials", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const materials = await prisma.material.findMany({ orderBy: { name: "asc" } });
    return reply.send(materials.map((m) => ({ id: m.id, name: m.name })));
  });

  app.get("/brands", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    return reply.send(brands.map((b) => ({ id: b.id, name: b.name })));
  });

  app.get("/categories", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const categories = await prisma.category.findMany({
      include: { parent: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });
    return reply.send(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        parentName: c.parent?.name ?? null,
        path: categoryPath(c),
      })),
    );
  });
}
