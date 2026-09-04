import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import type { WeatherDayDto } from "@wardrobe/shared";
import { toWeatherDayDtos } from "./weather.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@wardrobe/db", () => ({
  prisma: prismaMock,
}));

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
}));

describe("toWeatherDayDtos", () => {
  it("maps Open-Meteo's daily arrays into one DTO per day", () => {
    const dtos: WeatherDayDto[] = toWeatherDayDtos({
      daily: {
        time: ["2026-09-04", "2026-09-05"],
        weathercode: [0, 61],
        temperature_2m_max: [22.5, 18.1],
        temperature_2m_min: [12.3, 10.0],
      },
    });

    expect(dtos).toEqual([
      { date: "2026-09-04", weatherCode: 0, tempMaxC: 22.5, tempMinC: 12.3 },
      { date: "2026-09-05", weatherCode: 61, tempMaxC: 18.1, tempMinC: 10.0 },
    ]);
  });

  it("returns an empty array when the response has no daily field", () => {
    expect(toWeatherDayDtos({})).toEqual([]);
  });

  it("filters out days where weathercode, tempMaxC, or tempMinC is null", () => {
    const dtos: WeatherDayDto[] = toWeatherDayDtos({
      daily: {
        time: ["2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07"],
        weathercode: [0, null, 61, 45],
        temperature_2m_max: [22.5, 20.0, null, 19.1],
        temperature_2m_min: [12.3, 10.0, 8.5, null],
      },
    });

    // Only days with all three fields non-null should be included
    expect(dtos).toEqual([
      { date: "2026-09-04", weatherCode: 0, tempMaxC: 22.5, tempMinC: 12.3 },
    ]);
  });
});

describe("GET /weather", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    // Pin "now" so the 2026-09-01..2026-09-30 range used below falls entirely
    // within Open-Meteo's forecast window (today-92..today+15), keeping this
    // suite's dates request/response mapping assertions a regression check
    // independent of the forecast-window clamping covered in the describe
    // block below.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty array without calling Open-Meteo when the user has no location set", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: null,
      locationLon: null,
    } as never);

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-09-01&end=2026-09-30",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    await app.close();
  });

  it("fetches and maps Open-Meteo's forecast when a location is set", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        daily: {
          time: ["2026-09-04"],
          weathercode: [0],
          temperature_2m_max: [22.5],
          temperature_2m_min: [12.3],
        },
      }),
    } as Response);

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-09-01&end=2026-09-30",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { date: "2026-09-04", weatherCode: 0, tempMaxC: 22.5, tempMinC: 12.3 },
    ]);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get("latitude")).toBe("-33.87");
    expect(calledUrl.searchParams.get("longitude")).toBe("151.21");
    expect(calledUrl.searchParams.get("start_date")).toBe("2026-09-01");
    expect(calledUrl.searchParams.get("end_date")).toBe("2026-09-30");
    await app.close();
  });

  it("returns an empty array when the upstream request fails", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-09-01&end=2026-09-30",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    await app.close();
  });

  it("rejects a request missing start or end", async () => {
    const { weatherRoutes } = await import("./weather.js");

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({ method: "GET", url: "/weather?start=2026-09-01" });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    await app.close();
  });
});

describe("GET /weather - Open-Meteo forecast window clamping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("still requests the exact dates when the range is entirely within the window (no regression)", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] } }),
    } as Response);

    const app = Fastify();
    await app.register(weatherRoutes);

    // With "now" pinned to 2026-09-04, the valid window is 2026-06-04..2026-09-19,
    // so this range is entirely within it and should pass through unclamped.
    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-09-01&end=2026-09-15",
    });

    expect(response.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get("start_date")).toBe("2026-09-01");
    expect(calledUrl.searchParams.get("end_date")).toBe("2026-09-15");
    await app.close();
  });

  it("clamps the end date to today+15 when the requested range straddles the future boundary", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] } }),
    } as Response);

    const app = Fastify();
    await app.register(weatherRoutes);

    // Calendar month padded range: 2026-08-31 .. 2026-10-01. Today is 2026-09-04,
    // so the valid window is 2026-06-04 .. 2026-09-19. The end date should clamp
    // to 2026-09-19 instead of the raw requested 2026-10-01.
    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-08-31&end=2026-10-01",
    });

    expect(response.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get("start_date")).toBe("2026-08-31");
    expect(calledUrl.searchParams.get("end_date")).toBe("2026-09-19");
    await app.close();
  });

  it("clamps the start date to today-92 when the requested range straddles the past boundary", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] } }),
    } as Response);

    const app = Fastify();
    await app.register(weatherRoutes);

    // Today is 2026-09-04, so the valid window starts 2026-06-04. A request
    // starting well before that should clamp start_date to 2026-06-04.
    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-05-01&end=2026-06-10",
    });

    expect(response.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get("start_date")).toBe("2026-06-04");
    expect(calledUrl.searchParams.get("end_date")).toBe("2026-06-10");
    await app.close();
  });

  it("returns [] without calling Open-Meteo when the entire requested range is in the future beyond the window", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-12-01&end=2026-12-31",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns [] without calling Open-Meteo when the entire requested range is too far in the past", async () => {
    const { weatherRoutes } = await import("./weather.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      locationLat: -33.87,
      locationLon: 151.21,
    } as never);

    const app = Fastify();
    await app.register(weatherRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/weather?start=2026-01-01&end=2026-01-31",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    await app.close();
  });
});
