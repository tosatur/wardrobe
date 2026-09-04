import type { WeatherDayDto } from "@wardrobe/shared";
import { weatherIcon, weatherLabel } from "@/lib/weather";

export function DayWeather({ weather }: { weather: WeatherDayDto | undefined }) {
  if (!weather) return null;

  const Icon = weatherIcon(weather.weatherCode);

  return (
    <div
      className="flex items-center gap-1 text-[0.65rem] text-muted-foreground"
      title={weatherLabel(weather.weatherCode)}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- weatherIcon selects a stable, statically-imported lucide icon, not one created during render */}
      <Icon className="size-3" />
      <span>
        {Math.round(weather.tempMaxC)}°/{Math.round(weather.tempMinC)}°
      </span>
    </div>
  );
}
