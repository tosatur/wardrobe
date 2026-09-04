import type { FastifyInstance } from "fastify";
import { GeocodeQuerySchema, type GeocodeResultDto } from "@wardrobe/shared";
import { requireSession } from "./authorization.js";

type OpenMeteoGeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

export function toGeocodeResultDto(result: OpenMeteoGeocodeResult): GeocodeResultDto {
  return {
    name: result.name,
    admin1: result.admin1 ?? null,
    country: result.country ?? null,
    lat: result.latitude,
    lon: result.longitude,
  };
}

export async function geocodeRoutes(app: FastifyInstance) {
  app.get("/geocode", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = GeocodeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query parameters." });
    }

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", parsed.data.q);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const upstream = await fetch(url);
    if (!upstream.ok) {
      return reply.send([]);
    }
    const body = (await upstream.json()) as { results?: OpenMeteoGeocodeResult[] };

    return reply.send((body.results ?? []).map(toGeocodeResultDto));
  });
}
