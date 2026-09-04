import type { FastifyInstance } from "fastify";
import { WeatherQuerySchema, type WeatherDayDto } from "@wardrobe/shared";
import { prisma } from "@wardrobe/db";
import { requireSession } from "./authorization.js";

type OpenMeteoForecastResponse = {
  daily?: {
    time: string[];
    weathercode: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
};

export function toWeatherDayDtos(response: OpenMeteoForecastResponse): WeatherDayDto[] {
  const daily = response.daily;
  if (!daily) return [];

  return daily.time
    .map((date, i) => ({
      date,
      weatherCode: daily.weathercode[i],
      tempMaxC: daily.temperature_2m_max[i],
      tempMinC: daily.temperature_2m_min[i],
    }))
    .filter(
      (day): day is WeatherDayDto =>
        day.weatherCode != null && day.tempMaxC != null && day.tempMinC != null,
    );
}

const OPEN_METEO_PAST_DAYS = 92;
const OPEN_METEO_FUTURE_DAYS = 15;

/**
 * Open-Meteo's forecast endpoint rejects (HTTP 400) any request whose
 * start_date/end_date falls outside its supported window, rather than
 * clipping it. Clamp to that window here so a range that's only partially
 * covered (e.g. a padded calendar month) still returns weather for the days
 * that are in range, instead of the whole request being discarded.
 */
export function clampToForecastWindow(start: Date, end: Date): { start: Date; end: Date } | null {
  const now = new Date();
  const minDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - OPEN_METEO_PAST_DAYS),
  );
  const maxDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + OPEN_METEO_FUTURE_DAYS),
  );

  const clampedStart = start < minDate ? minDate : start;
  const clampedEnd = end > maxDate ? maxDate : end;
  if (clampedStart > clampedEnd) return null;
  return { start: clampedStart, end: clampedEnd };
}

export async function weatherRoutes(app: FastifyInstance) {
  app.get("/weather", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = WeatherQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query parameters." });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.locationLat == null || user?.locationLon == null) {
      return reply.send([]);
    }

    const { start, end } = parsed.data;
    const clamped = clampToForecastWindow(start, end);
    if (!clamped) {
      return reply.send([]);
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(user.locationLat));
    url.searchParams.set("longitude", String(user.locationLon));
    url.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("start_date", clamped.start.toISOString().slice(0, 10));
    url.searchParams.set("end_date", clamped.end.toISOString().slice(0, 10));

    const upstream = await fetch(url);
    if (!upstream.ok) {
      return reply.send([]);
    }
    const body = (await upstream.json()) as OpenMeteoForecastResponse;

    return reply.send(toWeatherDayDtos(body));
  });
}
