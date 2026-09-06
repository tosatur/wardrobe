import type { WeatherDayDto } from "@wardrobe/shared";
import { weatherIcon, weatherLabel } from "@/lib/weather";

export function DayWeather({
  weather,
  variant = "compact",
}: {
  weather: WeatherDayDto | undefined;
  /** "compact" is the calendar tile's small icon-plus-temps chip, with the
   *  label only in a title tooltip; "detailed" spells the label out inline,
   *  for the day-summary view. */
  variant?: "compact" | "detailed";
}) {
  if (!weather) return null;

  const Icon = weatherIcon(weather.weatherCode);
  const label = weatherLabel(weather.weatherCode);
  const temps = `${Math.round(weather.tempMaxC)}°/${Math.round(weather.tempMinC)}°`;

  if (variant === "detailed") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {/* eslint-disable-next-line react-hooks/static-components -- weatherIcon selects a stable, statically-imported lucide icon, not one created during render */}
        <Icon className="size-4" />
        <span>
          {label} · {temps}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground" title={label}>
      {/* eslint-disable-next-line react-hooks/static-components -- weatherIcon selects a stable, statically-imported lucide icon, not one created during render */}
      <Icon className="size-3" />
      <span>{temps}</span>
    </div>
  );
}
