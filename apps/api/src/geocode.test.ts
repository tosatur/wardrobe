import { describe, expect, it, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import type { GeocodeResultDto } from "@wardrobe/shared";
import { toGeocodeResultDto } from "./geocode.js";

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
}));

describe("toGeocodeResultDto", () => {
  it("maps an Open-Meteo geocoding result to the DTO shape", () => {
    const dto: GeocodeResultDto = toGeocodeResultDto({
      name: "Sydney",
      latitude: -33.8688,
      longitude: 151.2093,
      country: "Australia",
      admin1: "New South Wales",
    });

    expect(dto).toEqual({
      name: "Sydney",
      admin1: "New South Wales",
      country: "Australia",
      lat: -33.8688,
      lon: 151.2093,
    });
  });

  it("returns null admin1/country when the upstream result omits them", () => {
    const dto = toGeocodeResultDto({ name: "Nowhere", latitude: 0, longitude: 0 });

    expect(dto.admin1).toBeNull();
    expect(dto.country).toBeNull();
  });
});

describe("GET /geocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("proxies Open-Meteo's geocoding API and maps the results", async () => {
    const { geocodeRoutes } = await import("./geocode.js");

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { name: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "Australia", admin1: "New South Wales" },
        ],
      }),
    } as Response);

    const app = Fastify();
    await app.register(geocodeRoutes);

    const response = await app.inject({ method: "GET", url: "/geocode?q=Sydney" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { name: "Sydney", admin1: "New South Wales", country: "Australia", lat: -33.8688, lon: 151.2093 },
    ]);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(calledUrl.toString()).toContain("geocoding-api.open-meteo.com/v1/search");
    expect(calledUrl.searchParams.get("name")).toBe("Sydney");
    await app.close();
  });

  it("returns an empty array when the upstream response has no results field", async () => {
    const { geocodeRoutes } = await import("./geocode.js");

    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const app = Fastify();
    await app.register(geocodeRoutes);

    const response = await app.inject({ method: "GET", url: "/geocode?q=Nowhere" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    await app.close();
  });

  it("returns an empty array when the upstream request fails", async () => {
    const { geocodeRoutes } = await import("./geocode.js");

    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const app = Fastify();
    await app.register(geocodeRoutes);

    const response = await app.inject({ method: "GET", url: "/geocode?q=Sydney" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    await app.close();
  });

  it("rejects a request missing the q query parameter", async () => {
    const { geocodeRoutes } = await import("./geocode.js");

    const app = Fastify();
    await app.register(geocodeRoutes);

    const response = await app.inject({ method: "GET", url: "/geocode" });

    expect(response.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    await app.close();
  });
});
