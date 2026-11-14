"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  addDays,
  halfHourLabels,
  isoWeek,
  sameLocalDay,
  startOfIsoWeek,
} from "@/lib/talispros/iso-week";

const SLOTS = halfHourLabels();

function localeTag(locale: string): string {
  return locale === "de" ? "de-DE" : "en-CA";
}

/**
 * Date-driven week calendar for the Mapsites rail.
 * Half-hour slots belong to the selected day. The ISO week number selects that week.
 */
export default function MapsitesWeekCalendar({
  weekStart,
  onWeekStart,
}: {
  weekStart: Date;
  onWeekStart: (next: Date) => void;
}) {
  const locale = useLocale();
  const copy = useT().demo.slots;
  const tag = localeTag(locale);
  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes() < 30 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${minute}`;
  });

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const { week } = isoWeek(weekStart);
  const dayInWeek = days.some((day) => sameLocalDay(day, selectedDay))
    ? selectedDay
    : days[0];

  function go(delta: number) {
    onWeekStart(addDays(weekStart, delta * 7));
    setSelectedDay(addDays(dayInWeek, delta * 7));
  }

  function selectThisWeek() {
    onWeekStart(startOfIsoWeek(weekStart));
    document.getElementById("mapsites-week-folder")?.scrollIntoView({ block: "nearest" });
  }

  const dayLabel = dayInWeek.toLocaleDateString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section
      className="shrink-0 rounded-2xl bg-white px-3 py-3 ring-1 ring-black/10"
      data-testid="mapsites-week-calendar"
      aria-label={copy.calendarLabel}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full text-[18px] font-semibold text-neutral-950 ring-1 ring-neutral-300 hover:bg-neutral-100"
          aria-label={copy.prevWeek}
          data-testid="mapsites-week-prev"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={selectThisWeek}
          className="rounded-full px-3 py-1.5 text-[16px] font-semibold text-[#0356b0] underline decoration-[#0356b0]/40 underline-offset-2 hover:bg-[#e8f1fc]"
          data-testid="mapsites-week-number"
        >
          {copy.weekNumber.replace("{week}", String(week))}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full text-[18px] font-semibold text-neutral-950 ring-1 ring-neutral-300 hover:bg-neutral-100"
          aria-label={copy.nextWeek}
          data-testid="mapsites-week-next"
        >
          ›
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1" role="listbox" aria-label={copy.calendarLabel}>
        {days.map((day) => {
          const selected = sameLocalDay(day, dayInWeek);
          const isToday = sameLocalDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => setSelectedDay(day)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[13px] font-semibold leading-tight ${
                selected
                  ? "bg-[#046BD9] text-white"
                  : "bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
              }`}
              data-testid="mapsites-week-day"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide">
                {day.toLocaleDateString(tag, { weekday: "narrow" })}
              </span>
              <span>{day.getDate()}</span>
              {isToday ? <span className="sr-only">{copy.addedToday}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="m-0 mt-3 text-[15px] font-medium text-neutral-950" data-testid="mapsites-slot-caption">
        {copy.slotLabel.replace("{date}", dayLabel).replace("{time}", selectedSlot)}
      </p>
      <div
        className="mt-2 max-h-40 overflow-y-auto rounded-xl ring-1 ring-neutral-200"
        data-testid="mapsites-half-hours"
      >
        <ul className="m-0 list-none p-1">
          {SLOTS.map((slot) => {
            const selected = slot === selectedSlot;
            return (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={selected}
                  className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[15px] tabular-nums ${
                    selected
                      ? "bg-[#046BD9] font-semibold text-white"
                      : "text-neutral-950 hover:bg-neutral-100"
                  }`}
                  data-testid="mapsites-half-hour"
                >
                  {slot}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
