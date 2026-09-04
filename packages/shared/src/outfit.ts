import { z } from "zod";

export const OutfitItemPlacementSchema = z.object({
  itemId: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zIndex: z.number().int().nonnegative(),
});
export type OutfitItemPlacementInput = z.infer<typeof OutfitItemPlacementSchema>;

const tagNameSchema = z.string().trim().min(1).max(50);

// Plain field schemas with no .default(), shared by both create and update
// so that a partial update never silently re-applies a create-time default
// for a field the client didn't send.
const outfitFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  rating: z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
  items: z.array(OutfitItemPlacementSchema).max(30),
  tags: z.array(tagNameSchema).max(20),
  wornDates: z.array(z.coerce.date()).max(365),
};

export const OutfitCreateSchema = z.object(outfitFields).extend({
  items: outfitFields.items.default([]),
  tags: outfitFields.tags.default([]),
  wornDates: outfitFields.wornDates.default([]),
});
export type OutfitCreateInput = z.infer<typeof OutfitCreateSchema>;

export const OutfitUpdateSchema = z.object(outfitFields).partial();
export type OutfitUpdateInput = z.infer<typeof OutfitUpdateSchema>;

export const OutfitQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});
export type OutfitQueryInput = z.infer<typeof OutfitQuerySchema>;

export const OutfitItemDtoSchema = z.object({
  itemId: z.string(),
  x: z.number(),
  y: z.number(),
  zIndex: z.number(),
  item: z.object({
    id: z.string(),
    nickname: z.string().nullable(),
    categoryName: z.string(),
    photoCutoutUrl: z.string().nullable(),
    colors: z.array(z.object({ id: z.string(), name: z.string(), hex: z.string() })),
    price: z.number().nullable(),
    currency: z.string(),
  }),
});
export type OutfitItemDto = z.infer<typeof OutfitItemDtoSchema>;

export const OutfitDtoSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  coverPhotoUrl: z.string().nullable(),
  rating: z.number().nullable(),
  items: z.array(OutfitItemDtoSchema),
  tags: z.array(z.string()),
  wornDates: z.array(z.object({ id: z.string(), date: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OutfitDto = z.infer<typeof OutfitDtoSchema>;

export const WearCreateSchema = z.object({
  date: z.coerce.date().optional(),
});
export type WearCreateInput = z.infer<typeof WearCreateSchema>;

export const CalendarQuerySchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});
export type CalendarQueryInput = z.infer<typeof CalendarQuerySchema>;

export const CalendarWearDtoSchema = z.object({
  id: z.string(),
  date: z.string(),
  outfit: z.object({
    id: z.string(),
    name: z.string(),
    coverPhotoUrl: z.string().nullable(),
    items: z.array(OutfitItemDtoSchema),
  }),
});
export type CalendarWearDto = z.infer<typeof CalendarWearDtoSchema>;
