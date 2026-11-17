"use client";

import { useT } from "@/lib/i18n/client";
import WorkingPageShell from "@/components/talispros/WorkingPageShell";
import DemoHeroMap from "@/components/talispros/demo-mapsite/DemoHeroMap";
import FastCodeSlotsPanel from "@/components/talispros/demo-mapsite/FastCodeSlotsPanel";
import type { FastCodeSlotsPanelData } from "@/lib/talispros/fast-code-slots";
import type { SourcedLeadCalendar } from "@/lib/talispros/canada-calendar";

/** Lead-sourcing Mapsites page: sample card and week calendar, no PDF upload. */
export default function DemoMapsitesPanel({
  slotsPanel,
  foldersUnlocked = false,
  sourced,
}: {
  slotsPanel?: FastCodeSlotsPanelData;
  foldersUnlocked?: boolean;
  sourced?: SourcedLeadCalendar;
}) {
  const d = useT().demo;

  return (
    <WorkingPageShell testId="mapsites-page" contentTestId="mapsites-content">
      <section
        className="demo-hero mx-auto w-full"
        data-testid="demo-hero"
        aria-labelledby="demo-hero-title"
      >
        <div className="demo-hero__panel grid min-w-0 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_48px_rgba(0,0,0,0.10)]">
          <div className="demo-hero__media relative min-w-0">
            <DemoHeroMap />
          </div>
          <div className="demo-hero__rail flex min-h-0 min-w-0 flex-col px-5 py-6 sm:px-8 sm:py-7 lg:px-8 lg:py-5">
            <p className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-[13px]">
              {d.hero.eyebrow}
            </p>
            <h1
              id="demo-hero-title"
              className="mt-2 shrink-0 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-neutral-950 sm:text-[28px]"
              style={{ textWrap: "balance" }}
            >
              {d.hero.headline}
            </h1>
            {slotsPanel ? (
              <FastCodeSlotsPanel data={slotsPanel} foldersUnlocked={foldersUnlocked} sourced={sourced} />
            ) : null}
          </div>
        </div>
      </section>
    </WorkingPageShell>
  );
}
