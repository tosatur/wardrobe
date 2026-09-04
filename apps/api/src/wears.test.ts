import { describe, expect, it, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import type { CalendarWearDto } from "@wardrobe/shared";
import { toCalendarWearDto } from "./wears.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    outfitWear: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@wardrobe/db", () => ({
  prisma: prismaMock,
  Prisma: {},
}));

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
}));

function makeWear(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "wear-1",
    wornDate: new Date("2026-03-01T00:00:00Z"),
    outfit: {
      id: "outfit-1",
      name: "Weekend look",
      coverPhotoUrl: null,
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
    },
    ...overrides,
  };
}

describe("toCalendarWearDto", () => {
  it("maps a wear row to its calendar DTO shape, including item placements", () => {
    const dto: CalendarWearDto = toCalendarWearDto(
      makeWear({
        outfit: {
          id: "outfit-1",
          name: "Weekend look",
          coverPhotoUrl: null,
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
        },
      }) as never,
    );

    expect(dto).toEqual({
      id: "wear-1",
      date: "2026-03-01T00:00:00.000Z",
      outfit: {
        id: "outfit-1",
        name: "Weekend look",
        coverPhotoUrl: null,
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
              categoryName: "Jackets",
              photoCutoutUrl: "/items/item-1/photo/cutout",
              colors: [{ id: "color-1", name: "Blue", hex: "#2563EB" }],
              price: 89.99,
              currency: "USD",
            },
          },
        ],
      },
    });
  });

  it("maps an outfit with no items to an empty items array", () => {
    const dto = toCalendarWearDto(makeWear() as never);

    expect(dto.outfit.items).toEqual([]);
  });
});

describe("GET /wears", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns wears within the requested range, scoped to the session user's outfits", async () => {
    const { wearRoutes } = await import("./wears.js");
    const { prisma } = await import("@wardrobe/db");

    vi.mocked(prisma.outfitWear.findMany).mockResolvedValue([makeWear()] as never);

    const app = Fastify();
    await app.register(wearRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/wears?start=2026-03-01&end=2026-03-31",
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.outfitWear.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          outfit: { ownerId: "user-1" },
          wornDate: { gte: new Date("2026-03-01"), lte: new Date("2026-03-31") },
        },
      }),
    );
    expect(response.json()).toEqual([
      { id: "wear-1", date: "2026-03-01T00:00:00.000Z", outfit: { id: "outfit-1", name: "Weekend look", coverPhotoUrl: null, items: [] } },
    ]);
    await app.close();
  });

  it("rejects a request missing the start or end query parameters", async () => {
    const { wearRoutes } = await import("./wears.js");
    const { prisma } = await import("@wardrobe/db");

    const app = Fastify();
    await app.register(wearRoutes);

    const response = await app.inject({ method: "GET", url: "/wears?start=2026-03-01" });

    expect(response.statusCode).toBe(400);
    expect(prisma.outfitWear.findMany).not.toHaveBeenCalled();
    await app.close();
  });
});
