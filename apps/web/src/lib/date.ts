// Local-calendar-day date keys ("YYYY-MM-DD"), matched against the
// browser's own clock rather than UTC, so a wear or forecast day lands on
// the cell the viewer actually sees regardless of the timezone offset
// between the server's UTC timestamp and the browser rendering it.
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
