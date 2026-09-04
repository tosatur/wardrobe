import { z } from "zod";

export const ItemEventTypeSchema = z.enum(["wash", "alteration", "damage", "repair"]);
export type ItemEventType = z.infer<typeof ItemEventTypeSchema>;

export const ItemEventCreateSchema = z.object({
  type: ItemEventTypeSchema,
  date: z.coerce.date(),
  description: z.string().trim().max(500).optional(),
});
export type ItemEventCreateInput = z.infer<typeof ItemEventCreateSchema>;

export const ItemEventDtoSchema = z.object({
  id: z.string(),
  type: ItemEventTypeSchema,
  date: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});
export type ItemEventDto = z.infer<typeof ItemEventDtoSchema>;

// A dated item event (wash/alteration/damage/repair) and a wear (an outfit
// containing this item worn on some date) are different underlying
// records, but both are just "something that happened to this item on a
// date" for the timeline, so the history endpoint merges them into one
// discriminated shape sorted by date.
export const ItemHistoryEntryDtoSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("event"),
    id: z.string(),
    type: ItemEventTypeSchema,
    date: z.string(),
    description: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("worn"),
    id: z.string(),
    date: z.string(),
    outfitId: z.string(),
    outfitName: z.string(),
  }),
]);
export type ItemHistoryEntryDto = z.infer<typeof ItemHistoryEntryDtoSchema>;
