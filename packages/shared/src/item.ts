import { z } from "zod";
import { CurrencyCodeSchema } from "./currency.js";

export const ItemVisibilitySchema = z.enum(["private", "public"]);
export type ItemVisibility = z.infer<typeof ItemVisibilitySchema>;

export const PhotoStatusSchema = z.enum(["none", "processing", "ready", "failed"]);
export type PhotoStatus = z.infer<typeof PhotoStatusSchema>;

export const ItemStatusSchema = z.enum(["active", "archived"]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

const tagNameSchema = z.string().trim().min(1).max(50);

// Plain field schemas with no .default(), shared by both create and update
// so that a partial update never silently re-applies a create-time default
// (e.g. resetting `colorIds` back to `[]`) for a field the client didn't send.
const itemFields = {
  nickname: z.string().trim().max(100).optional(),
  categoryId: z.string().min(1, "Select a category."),
  brandName: z.string().trim().min(1).max(100).optional(),
  colorIds: z.array(z.string()).max(10),
  materialIds: z.array(z.string()).max(10),
  size: z.string().trim().min(1).max(50).optional(),
  purchaseDate: z.coerce.date().optional(),
  price: z.number().nonnegative().max(1_000_000).optional(),
  currency: CurrencyCodeSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  visibility: ItemVisibilitySchema,
  status: ItemStatusSchema.optional(),
  tags: z.array(tagNameSchema).max(20),
};

export const ItemCreateSchema = z.object(itemFields).extend({
  colorIds: itemFields.colorIds.default([]),
  materialIds: itemFields.materialIds.default([]),
  currency: itemFields.currency.default("USD"),
  visibility: itemFields.visibility.default("private"),
  tags: itemFields.tags.default([]),
});
export type ItemCreateInput = z.infer<typeof ItemCreateSchema>;

export const ItemUpdateSchema = z.object(itemFields).partial();
export type ItemUpdateInput = z.infer<typeof ItemUpdateSchema>;

const commaSeparatedIds = z
  .string()
  .transform((s) => s.split(",").filter(Boolean))
  .optional();

export const ItemQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  // Comma-separated ids, not repeated query keys: Fastify's default
  // querystring parser only returns an array for a key given more than
  // once, a single value comes back as a bare string - a comma-joined
  // single param sidesteps that inconsistency.
  categoryIds: commaSeparatedIds,
  colorId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  brandIds: commaSeparatedIds,
  materialId: z.string().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  tags: commaSeparatedIds,
  q: z.string().trim().max(200).optional(),
  photoStatus: PhotoStatusSchema.optional(),
  status: ItemStatusSchema.optional(),
});
export type ItemQueryInput = z.infer<typeof ItemQuerySchema>;

export const ItemStatsDtoSchema = z.object({
  timesWorn: z.number().int().nonnegative(),
  lastWornDate: z.string().nullable(),
  costPerWear: z.number().nullable(),
});
export type ItemStatsDto = z.infer<typeof ItemStatsDtoSchema>;

export const ItemDtoSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  nickname: z.string().nullable(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    parentName: z.string().nullable(),
    path: z.string(),
  }),
  brand: z.object({ id: z.string(), name: z.string() }).nullable(),
  colors: z.array(z.object({ id: z.string(), name: z.string(), hex: z.string() })),
  materials: z.array(z.object({ id: z.string(), name: z.string() })),
  size: z.string().nullable(),
  purchaseDate: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string(),
  notes: z.string().nullable(),
  photoUrl: z.string().nullable(),
  photoCutoutUrl: z.string().nullable(),
  photoThumbnailUrl: z.string().nullable(),
  photoStatus: PhotoStatusSchema,
  visibility: ItemVisibilitySchema,
  status: ItemStatusSchema,
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: ItemStatsDtoSchema.nullable(),
});
export type ItemDto = z.infer<typeof ItemDtoSchema>;

export const ColorDtoSchema = z.object({ id: z.string(), name: z.string(), hex: z.string() });
export type ColorDto = z.infer<typeof ColorDtoSchema>;

export const MaterialDtoSchema = z.object({ id: z.string(), name: z.string() });
export type MaterialDto = z.infer<typeof MaterialDtoSchema>;

export const BrandDtoSchema = z.object({ id: z.string(), name: z.string() });
export type BrandDto = z.infer<typeof BrandDtoSchema>;

export const CategoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  parentName: z.string().nullable(),
  path: z.string(),
});
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
