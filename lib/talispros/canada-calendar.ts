import {
  CANADA_SOURCE_TIME_ZONE,
  addDays,
  canadaSourcedDay,
  isoWeekKey,
  startOfIsoWeek,
} from "@/lib/talispros/iso-week";

export { CANADA_SOURCE_TIME_ZONE, canadaSourcedDay };

export function canadaSourcedTime(iso: string, locale: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-CA", {
    timeZone: CANADA_SOURCE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Local calendar date for a civil day, with no UTC shift. */
export function civilDate(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  const value = new Date(year, month - 1, date);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== date) return null;
  return value;
}

export function civilKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function weekKeyForCivilDay(day: string): string | null {
  const date = civilDate(day);
  if (!date) return null;
  return isoWeekKey(date);
}

export function mondayOfIsoWeek(year: number, week: number): Date {
  const weekOne = startOfIsoWeek(new Date(year, 0, 4));
  return addDays(weekOne, (week - 1) * 7);
}

export function mondayFromWeekKey(key: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return null;
  return mondayOfIsoWeek(Number(match[1]), Number(match[2]));
}

/** Sorted unique ISO week keys that contain at least one sourced day. */
export function leadWeekKeys(days: readonly string[]): string[] {
  const keys = new Set<string>();
  for (const day of days) {
    const key = weekKeyForCivilDay(day);
    if (key) keys.add(key);
  }
  return [...keys].sort();
}

/**
 * Current week when it has sourced leads. Otherwise the latest earlier week
 * that has leads. An empty list stays on the current week.
 */
export function openingWeekStart(days: readonly string[], now = new Date()): Date {
  const current = startOfIsoWeek(now);
  const keys = leadWeekKeys(days);
  if (!keys.length) return current;
  const currentKey = isoWeekKey(current);
  if (keys.includes(currentKey)) return current;
  const earlier = keys.filter((key) => key < currentKey);
  const pick = earlier.at(-1) ?? keys.at(-1);
  return (pick && mondayFromWeekKey(pick)) || current;
}

/** Next or previous week that actually has leads. Null when there is nowhere to go. */
export function neighboringLeadWeek(weekStart: Date, delta: -1 | 1, days: readonly string[]): Date | null {
  const keys = leadWeekKeys(days);
  if (!keys.length) return addDays(weekStart, delta * 7);
  const currentKey = isoWeekKey(weekStart);
  const index = keys.indexOf(currentKey);
  let nextIndex = -1;
  if (index === -1) {
    if (delta > 0) nextIndex = keys.findIndex((key) => key > currentKey);
    else {
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        if (keys[i]! < currentKey) {
          nextIndex = i;
          break;
        }
      }
    }
  } else {
    nextIndex = index + delta;
  }
  const next = keys[nextIndex];
  return next ? mondayFromWeekKey(next) : null;
}

/** A sourced prospect on the Mapsites calendar. No phone, email, or notes. */
export type SourcedLead = {
  id: string;
  brokerage: string;
  town: string;
  province: string;
  sourcedAt: string;
  /** America/Toronto calendar day, YYYY-MM-DD. */
  day: string;
};

export type SourcedLeadCalendar = {
  counts: { day: string; count: number }[];
  /** Names are included only after the folder access code is accepted. */
  leads: SourcedLead[];
};

export function countsByDay(days: readonly string[]): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    if (!civilDate(day)) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([day, count]) => ({ day, count }));
}

/** Today when it has leads, otherwise the latest day in the week that has leads. */
export function preferredDay(weekStart: Date, days: readonly string[], now = new Date()): Date {
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const counted = new Set(days);
  const todayInWeek = weekDays.find((day) => civilKey(day) === civilKey(today));
  if (todayInWeek && counted.has(civilKey(todayInWeek))) return todayInWeek;
  const withLeads = weekDays.filter((day) => counted.has(civilKey(day)));
  if (withLeads.length) return withLeads[withLeads.length - 1]!;
  return todayInWeek ?? weekDays[0]!;
}
