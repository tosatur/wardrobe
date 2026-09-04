import { describe, expect, it } from "vitest";
import { Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { weatherIcon, weatherLabel } from "./weather";

describe("weatherIcon", () => {
  it("maps clear sky (0) to Sun", () => {
    expect(weatherIcon(0)).toBe(Sun);
  });

  it("maps overcast (3) to Cloud", () => {
    expect(weatherIcon(3)).toBe(Cloud);
  });

  it("maps fog (45, 48) to CloudFog", () => {
    expect(weatherIcon(45)).toBe(CloudFog);
    expect(weatherIcon(48)).toBe(CloudFog);
  });

  it("maps rain and drizzle codes to CloudRain", () => {
    for (const code of [51, 61, 63, 65, 80, 81, 82]) {
      expect(weatherIcon(code)).toBe(CloudRain);
    }
  });

  it("maps snow codes to CloudSnow", () => {
    for (const code of [71, 73, 75, 77, 85, 86]) {
      expect(weatherIcon(code)).toBe(CloudSnow);
    }
  });

  it("maps thunderstorm codes to CloudLightning", () => {
    for (const code of [95, 96, 99]) {
      expect(weatherIcon(code)).toBe(CloudLightning);
    }
  });

  it("falls back to Cloud for an unrecognized code", () => {
    expect(weatherIcon(9999)).toBe(Cloud);
  });
});

describe("weatherLabel", () => {
  it("returns a human-readable label for a known code", () => {
    expect(weatherLabel(0)).toBe("Clear sky");
    expect(weatherLabel(61)).toBe("Rain");
  });

  it("returns a fallback label for an unrecognized code", () => {
    expect(weatherLabel(9999)).toBe("Unknown");
  });
});
