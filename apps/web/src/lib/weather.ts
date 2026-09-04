import { Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, type LucideIcon } from "lucide-react";

const ICONS: [codes: number[], icon: LucideIcon][] = [
  [[0], Sun],
  [[1, 2, 3], Cloud],
  [[45, 48], CloudFog],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], CloudRain],
  [[71, 73, 75, 77, 85, 86], CloudSnow],
  [[95, 96, 99], CloudLightning],
];

const LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function weatherIcon(code: number): LucideIcon {
  return ICONS.find(([codes]) => codes.includes(code))?.[1] ?? Cloud;
}

export function weatherLabel(code: number): string {
  return LABELS[code] ?? "Unknown";
}
