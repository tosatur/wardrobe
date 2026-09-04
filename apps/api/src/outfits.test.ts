import { describe, expect, it, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import type { OutfitDto } from "@wardrobe/shared";
import { toOutfitDto } from "./outfits.js";

const { prismaMock } = vi.hoisted(() => {
  const mock: Record<string, unknown> = {
    outfit: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    outfitItem: {
      deleteMany: vi.fn(),
    },
    outfitTag: {
      deleteMany: vi.fn(),
    },
    outfitWear: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    item: {
      count: vi.fn(),
    },
  };
  mock.$transaction = vi.fn((fn: (tx: unknown) => unknown) => fn(mock));
  return { prismaMock: mock };
});

vi.mock("@wardrobe/db", () => ({
  prisma: prismaMock,
  Prisma: {},
}));

vi.mock("@wardrobe/storage", () => ({
  LocalStorageDriver: class {
    save = vi.fn().mockResolvedValue({ key: "new-key.png" });
    read = vi.fn().mockResolvedValue(Buffer.from("fake-png-bytes"));
    delete = vi.fn();
  },
  validateAndStripImage: vi.fn().mockResolvedValue({
    buffer: Buffer.from("fake"),
    mime: "image/png",
    extension: "png",
  }),
  InvalidImageError: class InvalidImageError extends Error {},
}));

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
  canModify: () => true,
}));

function makeOutfit(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "outfit-1",
    ownerId: "user-1",
    name: "Weekend look",
    description: null,
    coverPhotoKey: null,
    rating: null,
    items: [] as {
      itemId: string;
      x: number;
      y: number;
      zIndex: number;
      scale: number;
      rotation: number;
      item: {
        id: string;
        nickname: string | null;
        photoCutoutKey: string | null;
        category: { name: string };
        colors: { color: { id: string; name: string; hex: string } }[];
        price: number | null;
        currency: string;
      };
    }[],
    tags: [] as { tag: { name: string } }[],
    wears: [] as { id: string; wornDate: Date }[],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("toOutfitDto", () => {
  it("maps placed items, deriving photoCutoutUrl from the item's cutout key", () => {
    const outfit = makeOutfit({
      items: [
        {
          itemId: "item-1",
          x: 25,
          y: 40,
          zIndex: 1,
          scale: 1,
          rotation: 0,
          item: {
            id: "item-1",
            nickname: "Denim jacket",
            photoCutoutKey: "cutout.png",
            category: { name: "Jackets" },
            colors: [{ color: { id: "color-1", name: "Blue", hex: "#2563EB" } }],
            price: 89.99,
            currency: "USD",
          },
        },
      ],
    });

    const dto: OutfitDto = toOutfitDto(outfit as never);

    expect(dto.items).toEqual([
      {
        itemId: "item-1",
        x: 25,
        y: 40,
        zIndex: 1,
        scale: 1,
        rotation: 0,
        item: {
          id: "item-1",
          nickname: "Denim jacket",
          categoryName: "Jackets",
          photoCutoutUrl: "/items/item-1/photo/cutout",
          colors: [{ id: "color-1", name: "Blue", hex: "#2563EB" }],
          price: 89.99,
          currency: "USD",
        },
      },
    ]);
  });

  it("returns a null photoCutoutUrl when the item has no cutout key", () => {
    const outfit = makeOutfit({
      items: [
        {
          itemId: "item-1",
          x: 0,
          y: 0,
          zIndex: 1,
          scale: 1,
          rotation: 0,
          item: {
            id: "item-1",
            nickname: null,
            photoCutoutKey: null,
            category: { name: "Jackets" },
            colors: [],
            price: null,
            currency: "USD",
          },
        },
      ],
    });

    const dto = toOutfitDto(outfit as never);

    expect(dto.items[0]?.item.photoCutoutUrl).toBeNull();
  });
});

describe("POST /outfits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an outfit with initial item placements", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.item.count).mockResolvedValue(1);
    vi.mocked(prisma.outfit.create).mockResolvedValue(makeOutfit() as never);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/outfits",
      payload: { name: "Weekend look", items: [{ itemId: "item-1", x: 25, y: 40, zIndex: 1 }] },
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.outfit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Weekend look",
          ownerId: "user-1",
          items: {
            create: [{ itemId: "item-1", x: 25, y: 40, zIndex: 1, scale: 1, rotation: 0 }],
          },
        }),
      }),
    );
    await app.close();
  });

  it("rejects placements referencing an item the user doesn't own or that isn't ready", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.item.count).mockResolvedValue(0);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/outfits",
      payload: { name: "Weekend look", items: [{ itemId: "item-1", x: 25, y: 40, zIndex: 1 }] },
    });

    expect(response.statusCode).toBe(400);
    expect(prisma.outfit.create).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects a duplicate itemId within the same placement list", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/outfits",
      payload: {
        name: "Weekend look",
        items: [
          { itemId: "item-1", x: 25, y: 40, zIndex: 1 },
          { itemId: "item-1", x: 60, y: 10, zIndex: 2 },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(prisma.outfit.create).not.toHaveBeenCalled();
    await app.close();
  });
});

describe("POST /outfits/:id/wears", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a wear for the given date", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(makeOutfit() as never);
    vi.mocked(prisma.outfitWear.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.outfit.update).mockResolvedValue(makeOutfit() as never);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/outfits/outfit-1/wears",
      payload: { date: "2026-03-01" },
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.outfit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outfit-1" },
        data: { wears: { create: [{ wornDate: new Date("2026-03-01") }] } },
      }),
    );
    await app.close();
  });

  it("defaults to today's date when none is given", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(makeOutfit() as never);
    vi.mocked(prisma.outfitWear.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.outfit.update).mockResolvedValue(makeOutfit() as never);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({ method: "POST", url: "/outfits/outfit-1/wears" });

    expect(response.statusCode).toBe(201);
    expect(prisma.outfit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { wears: { create: [{ wornDate: expect.any(Date) }] } },
      }),
    );
    await app.close();
  });

  it("returns 409 when the outfit is already logged for that day", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(makeOutfit() as never);
    vi.mocked(prisma.outfitWear.findFirst).mockResolvedValue({
      id: "wear-1",
      outfitId: "outfit-1",
      wornDate: new Date("2026-03-01T08:00:00Z"),
      createdAt: new Date("2026-03-01T08:00:00Z"),
    } as never);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/outfits/outfit-1/wears",
      payload: { date: "2026-03-01T20:00:00Z" },
    });

    expect(response.statusCode).toBe(409);
    expect(prisma.outfit.update).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns 404 when the outfit doesn't exist or isn't owned by the session user", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(null);

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({ method: "POST", url: "/outfits/outfit-1/wears" });

    expect(response.statusCode).toBe(404);
    expect(prisma.outfit.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe("POST /outfits/:id/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function injectPhoto(app: ReturnType<typeof Fastify>, url: string) {
    const boundary = "----testboundary";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="cover.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      Buffer.from("fake-image-bytes"),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return app.inject({
      method: "POST",
      url,
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
  }

  it("stores the cover photo", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(
      makeOutfit({ coverPhotoKey: "old-cover.png" }) as never,
    );
    vi.mocked(prisma.outfit.update).mockResolvedValue(
      makeOutfit({ coverPhotoKey: "new-key.png" }) as never,
    );

    const app = Fastify();
    await app.register(multipart);
    await app.register(outfitRoutes);

    const response = await injectPhoto(app, "/outfits/outfit-1/photo");

    expect(response.statusCode).toBe(200);
    expect(prisma.outfit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outfit-1" },
        data: { coverPhotoKey: "new-key.png" },
      }),
    );
    await app.close();
  });

  it("returns 404 when the outfit doesn't exist or isn't owned by the session user", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(null);

    const app = Fastify();
    await app.register(multipart);
    await app.register(outfitRoutes);

    const response = await injectPhoto(app, "/outfits/outfit-1/photo");

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});

describe("GET /outfits/:id/photo/cover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the outfit has no cover photo", async () => {
    const { outfitRoutes } = await import("./outfits.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfit.findUnique).mockResolvedValue(
      makeOutfit({ coverPhotoKey: null }) as never,
    );

    const app = Fastify();
    await app.register(outfitRoutes);

    const response = await app.inject({ method: "GET", url: "/outfits/outfit-1/photo/cover" });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});
