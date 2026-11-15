"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  canadaSourcedTime,
  civilKey,
  neighboringLeadWeek,
  preferredDay,
  type SourcedLead,
} from "@/lib/talispros/canada-calendar";
import { addDays, isoWeek, sameLocalDay } from "@/lib/talispros/iso-week";

function localeTag(locale: string): string {
  return locale === "de" ? "de-DE" : "en-CA";
}

function leadPlace(lead: SourcedLead): string {
  return lead.province ? `${lead.town}, ${lead.province}` : lead.town;
}

/**
 * Week calendar for sourced leads. Weeks with no leads are skipped.
 * Each lead sits on its Canada day.
 */
export default function MapsitesWeekCalendar({
  weekStart,
  onWeekStart,
  leadDays,
  counts,
  leads,
  unlocked,
  onAskUnlock,
}: {
  weekStart: Date;
  onWeekStart: (next: Date) => void;
  leadDays: readonly string[];
  counts: ReadonlyMap<string, number>;
  leads: readonly SourcedLead[];
  unlocked: boolean;
  onAskUnlock: () => void;
}) {
  const locale = useLocale();
  const copy = useT().demo.slots;
  const tag = localeTag(locale);
  const today = useMemo(() => new Date(), []);
  const leadDayKey = leadDays.join("|");
  const weekId = weekStart.getTime();
  const [picked, setPicked] = useState<{ weekId: number; dayKey: string; day: Date } | null>(null);
  const selectedDay =
    picked && picked.weekId === weekId && picked.dayKey === leadDayKey
      ? picked.day
      : preferredDay(weekStart, leadDays);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const { week } = isoWeek(weekStart);
  const dayInWeek = days.some((day) => sameLocalDay(day, selectedDay)) ? selectedDay : days[0]!;
  const selectedKey = civilKey(dayInWeek);
  const selectedCount = counts.get(selectedKey) ?? 0;
  const selectedLeads = leads.filter((lead) => lead.day === selectedKey);
  const prev = neighboringLeadWeek(weekStart, -1, leadDays);
  const next = neighboringLeadWeek(weekStart, 1, leadDays);
  const fromLabel = days[0]!.toLocaleDateString(tag, { month: "short", day: "numeric" });
  const toLabel = days[6]!.toLocaleDateString(tag, { month: "short", day: "numeric" });
  const range = copy.weekRange.replace("{from}", fromLabel).replace("{to}", toLabel);

  function go(target: Date | null) {
    if (!target) return;
    onWeekStart(target);
  }

  return (
    <section
      className="shrink-0 rounded-2xl bg-white px-3 py-3 ring-1 ring-black/10"
      data-testid="mapsites-week-calendar"
      aria-label={copy.calendarLabel}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(prev)}
          disabled={!prev}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full text-[18px] font-semibold text-neutral-950 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:opacity-30"
          aria-label={copy.prevWeek}
          data-testid="mapsites-week-prev"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-[16px] font-semibold text-[#0356b0]" data-testid="mapsites-week-number">
            {copy.weekNumber.replace("{week}", String(week))}
          </div>
          <div className="text-[13px] text-neutral-600" data-testid="mapsites-week-range">
            {range}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(next)}
          disabled={!next}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full text-[18px] font-semibold text-neutral-950 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:opacity-30"
          aria-label={copy.nextWeek}
          data-testid="mapsites-week-next"
        >
          ›
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1" role="listbox" aria-label={copy.calendarLabel}>
        {days.map((day) => {
          const key = civilKey(day);
          const selected = sameLocalDay(day, dayInWeek);
          const isToday = sameLocalDay(day, today);
          const count = counts.get(key) ?? 0;
          return (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                setPicked({ weekId, dayKey: leadDayKey, day });
                if (!unlocked && count > 0) onAskUnlock();
              }}
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
              {count > 0 ? (
                <span
                  className={`mt-0.5 text-[10px] font-semibold ${selected ? "text-white" : "text-[#0356b0]"}`}
                  data-testid="sourced-day-count"
                >
                  {count}
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] font-medium opacity-50" aria-hidden>
                  ·
                </span>
              )}
              {isToday ? <span className="sr-only">{copy.addedToday}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3" data-testid="sourced-day-leads">
        <p className="m-0 text-[15px] font-medium text-neutral-950">
          {dayInWeek.toLocaleDateString(tag, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        {selectedCount === 0 ? (
          <p className="m-0 mt-1 text-[14px] text-neutral-600">{copy.sourcedNone}</p>
        ) : unlocked ? (
          <ul className="m-0 mt-1 max-h-36 list-none overflow-y-auto p-0">
            {selectedLeads.map((lead) => {
              const place = leadPlace(lead);
              return (
                <li
                  key={lead.id}
                  className="border-b border-neutral-100 py-1.5 text-[14px] leading-snug text-neutral-950"
                  data-testid="sourced-lead"
                >
                  <span className="font-medium">{lead.brokerage}</span>
                  {place ? <span className="text-neutral-600">{`, ${place}`}</span> : null}
                  <span className="ml-2 tabular-nums text-neutral-500">
                    {canadaSourcedTime(lead.sourcedAt, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={onAskUnlock}
            className="mt-1 text-left text-[14px] font-semibold text-[#0356b0] underline decoration-[#0356b0]/40 underline-offset-2"
            data-testid="sourced-day-locked"
          >
            {copy.sourcedCount.replace("{count}", String(selectedCount))}
            {". "}
            {copy.sourcedLocked}
          </button>
        )}
      </div>
    </section>
  );
}
