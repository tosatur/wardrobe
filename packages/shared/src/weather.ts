import { z } from "zod";

export const GeocodeQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});
export type GeocodeQueryInput = z.infer<typeof GeocodeQuerySchema>;

export const GeocodeResultDtoSchema = z.object({
  name: z.string(),
  admin1: z.string().nullable(),
  country: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});
export type GeocodeResultDto = z.infer<typeof GeocodeResultDtoSchema>;

export const WeatherQuerySchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});
export type WeatherQueryInput = z.infer<typeof WeatherQuerySchema>;

export const WeatherDayDtoSchema = z.object({
  date: z.string(),
  weatherCode: z.number(),
  tempMaxC: z.number(),
  tempMinC: z.number(),
});
export type WeatherDayDto = z.infer<typeof WeatherDayDtoSchema>;
