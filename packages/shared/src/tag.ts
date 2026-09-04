import { z } from "zod";

export const TagListResponseSchema = z.array(z.string());
export type TagListResponse = z.infer<typeof TagListResponseSchema>;
