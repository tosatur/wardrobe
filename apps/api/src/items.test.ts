import { describe, expect, it, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import type { ItemDto } from "@wardrobe/shared";
import { toItemDto, computeItemStats } from "./items.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    item: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    outfitWear: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@wardrobe/db", () => ({
  prisma: prismaMock,
  Prisma: {},
}));

vi.mock("@wardrobe/storage", () => ({
  LocalStorageDriver: class {
    save = vi.fn().mockResolvedValue({ key: "new-key.jpg" });
    read = vi.fn();
    delete = vi.fn();
  },
  validateAndStripImage: vi.fn().mockResolvedValue({
    buffer: Buffer.from("fake"),
    mime: "image/jpeg",
    extension: "jpg",
  }),
  InvalidImageError: class InvalidImageError extends Error {},
}));

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
  canView: () => true,
  canModify: () => true,
}));

const ITEM_INCLUDE_SHAPE = {
  tags: [] as { tag: { id: string; name: string } }[],
  colors: [] as { color: { id: string; name: string; hex: string } }[],
  materials: [] as { material: { id: string; name: string } }[],
  category: { id: "cat-1", name: "Shirts", parent: null },
  brand: null,
};

function makeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1",
    ownerId: "user-1",
    nickname: null,
    size: null,
    purchaseDate: null,
    price: null,
    currency: "USD",
    notes: null,
    photoOriginalKey: null,
    photoOriginalMime: null,
    photoCutoutKey: null,
    photoThumbnailKey: null,
    photoStatus: "none" as const,
    visibility: "private" as const,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...ITEM_INCLUDE_SHAPE,
    ...overrides,
  };
}

describe("toItemDto", () => {
  it("maps photoCutoutUrl, photoThumbnailUrl, and photoStatus from storage keys", () => {
    const item = makeItem({
      photoOriginalKey: "orig.jpg",
      photoOriginalMime: "image/jpeg",
      photoCutoutKey: "cutout.png",
      photoThumbnailKey: "thumb.webp",
      photoStatus: "ready",
    });

    const dto: ItemDto = toItemDto(item as never);

    expect(dto.photoUrl).toBe("/items/item-1/photo/original");
    expect(dto.photoCutoutUrl).toBe("/items/item-1/photo/cutout");
    expect(dto.photoThumbnailUrl).toBe("/items/item-1/photo/thumbnail");
    expect(dto.photoStatus).toBe("ready");
  });

  it("returns null photo URLs when no keys are set", () => {
    const dto = toItemDto(makeItem() as never);

    expect(dto.photoUrl).toBeNull();
    expect(dto.photoCutoutUrl).toBeNull();
    expect(dto.photoThumbnailUrl).toBeNull();
    expect(dto.photoStatus).toBe("none");
  });
});

describe("computeItemStats", () => {
  it("counts every worn date and reports the most recent as lastWornDate", () => {
    const stats = computeItemStats(
      [new Date("2026-01-05T00:00:00Z"), new Date("2026-02-10T00:00:00Z")],
      null,
    );

    expect(stats.timesWorn).toBe(2);
    expect(stats.lastWornDate).toBe("2026-02-10T00:00:00.000Z");
  });

  it("returns zero times worn and a null lastWornDate when never worn", () => {
    const stats = computeItemStats([], null);

    expect(stats.timesWorn).toBe(0);
    expect(stats.lastWornDate).toBeNull();
  });

  it("divides price by times worn to compute costPerWear when both are available", () => {
    const stats = computeItemStats(
      [new Date("2026-01-05T00:00:00Z"), new Date("2026-02-10T00:00:00Z")],
      100,
    );

    expect(stats.costPerWear).toBe(50);
  });

  it("returns a null costPerWear when the item has no price", () => {
    const stats = computeItemStats([new Date("2026-01-05T00:00:00Z")], null);

    expect(stats.costPerWear).toBeNull();
  });

  it("returns a null costPerWear when the item has never been worn, even with a price", () => {
    const stats = computeItemStats([], 100);

    expect(stats.costPerWear).toBeNull();
  });
});

describe("GET /items/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes stats derived from the item's outfit wear history", async () => {
    const { itemRoutes } = await import("./items.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.item.findUnique).mockResolvedValue(makeItem({ price: 100 }) as never);
    vi.mocked(prisma.outfitWear.findMany).mockResolvedValue([
      { wornDate: new Date("2026-01-05T00:00:00Z") },
      { wornDate: new Date("2026-02-10T00:00:00Z") },
    ] as never);

    const app = Fastify();
    await app.register(itemRoutes);

    const response = await app.inject({ method: "GET", url: "/items/item-1" });

    expect(response.statusCode).toBe(200);
    expect(prisma.outfitWear.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { outfit: { items: { some: { itemId: "item-1" } } } },
      }),
    );
    expect(response.json().stats).toEqual({
      timesWorn: 2,
      lastWornDate: "2026-02-10T00:00:00.000Z",
      costPerWear: 50,
    });
    await app.close();
  });
});

describe("POST /items/:id/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the original and resets processing state", async () => {
    const { itemRoutes } = await import("./items.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.item.findUnique).mockResolvedValue(
      makeItem({ photoCutoutKey: "old-cutout.png", photoThumbnailKey: "old-thumb.webp" }) as never,
    );
    vi.mocked(prisma.item.update).mockResolvedValue(makeItem({ photoStatus: "processing" }) as never);

    const app = Fastify();
    await app.register(multipart);
    await app.register(itemRoutes);

    const boundary = "----testboundary";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
      ),
      Buffer.from("fake-image-bytes"),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/items/item-1/photo",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          photoOriginalKey: "new-key.jpg",
          photoCutoutKey: null,
          photoThumbnailKey: null,
          photoStatus: "processing",
        }),
      }),
    );
    await app.close();
  });
});
