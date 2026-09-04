import type { GeocodeResultDto, WeatherDayDto } from "@wardrobe/shared";
import { authFetch } from "./auth-client";

export async function geocodeSearch(q: string): Promise<GeocodeResultDto[]> {
  if (!q.trim()) return [];
  const res = await authFetch(`/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getWeather(range: { start: string; end: string }): Promise<WeatherDayDto[]> {
  const params = new URLSearchParams(range);
  const res = await authFetch(`/weather?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}
