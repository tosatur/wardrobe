import type { FastifyInstance } from "fastify";
import { CalendarQuerySchema, type CalendarWearDto } from "@wardrobe/shared";
import { prisma } from "@wardrobe/db";
import { requireSession } from "./authorization.js";
import { toOutfitItemDto } from "./outfits.js";

type WearWithOutfit = {
  id: string;
  wornDate: Date;
  outfit: {
    id: string;
    name: string;
    coverPhotoUrl: string | null;
    items: Parameters<typeof toOutfitItemDto>[0][];
  };
};

export function toCalendarWearDto(wear: WearWithOutfit): CalendarWearDto {
  return {
    id: wear.id,
    date: wear.wornDate.toISOString(),
    outfit: {
      id: wear.outfit.id,
      name: wear.outfit.name,
      coverPhotoUrl: wear.outfit.coverPhotoUrl,
      items: wear.outfit.items.map(toOutfitItemDto),
    },
  };
}

export async function wearRoutes(app: FastifyInstance) {
  app.get("/wears", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = CalendarQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query parameters." });
    }
    const { start, end } = parsed.data;

    const wears = await prisma.outfitWear.findMany({
      where: { outfit: { ownerId: session.user.id }, wornDate: { gte: start, lte: end } },
      include: {
        outfit: {
          select: {
            id: true,
            name: true,
            coverPhotoUrl: true,
            items: {
              include: {
                item: { include: { category: true, colors: { include: { color: true } } } },
              },
            },
          },
        },
      },
      orderBy: { wornDate: "asc" },
    });

    return reply.send(wears.map(toCalendarWearDto));
  });
}
