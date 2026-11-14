/** ISO-8601 week helpers. Weeks start Monday. Dates are local calendar days. */

export type IsoWeek = { year: number; week: number };

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday of the ISO week that contains `date`. */
export function startOfIsoWeek(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay() || 7;
  day.setDate(day.getDate() - weekday + 1);
  return day;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function isoWeek(date: Date): IsoWeek {
  const day = startOfLocalDay(date);
  const thursday = addDays(day, 4 - (day.getDay() || 7));
  const year = thursday.getFullYear();
  const firstThursday = startOfIsoWeek(new Date(year, 0, 4));
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000) + 1;
  return { year, week };
}

/** `2026-W46` so folders can be generated per week. */
export function isoWeekKey(date: Date): string {
  const { year, week } = isoWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 48 labels, 00:00 through 23:30. */
export function halfHourLabels(): string[] {
  const labels: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    labels.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }
  return labels;
}

/** Ontario and Quebec hold most sourced leads, so the day is Eastern Time. */
export const CANADA_SOURCE_TIME_ZONE = "America/Toronto";

/** Calendar day in Canada for an instant. Null when the timestamp cannot be read. */
export function canadaSourcedDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CANADA_SOURCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

/** ISO week of the Canada day, not the viewer's local day. */
export function weekKeyFromAddedAt(addedAt: string | null): string | null {
  const day = canadaSourcedDay(addedAt);
  if (!day) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isoWeekKey(date);
}
