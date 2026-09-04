import type { WeatherDayDto } from "@wardrobe/shared";
import { weatherIcon, weatherLabel } from "@/lib/weather";

export function DayWeather({ weather }: { weather: WeatherDayDto | undefined }) {
  if (!weather) return null;

  const Icon = weatherIcon(weather.weatherCode);

  return (
    <div
      className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1 text-[0.65rem] text-muted-foreground duration-300 ease-out"
      title={weatherLabel(weather.weatherCode)}
    >
      <Icon className="size-3" />
      <span>
        {Math.round(weather.tempMaxC)}°/{Math.round(weather.tempMinC)}°
      </span>
    </div>
  );
}
