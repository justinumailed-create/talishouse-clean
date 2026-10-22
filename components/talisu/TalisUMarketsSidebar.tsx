"use client";

import { useMemo } from "react";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import { TALISWEBS_US_MARKETS_URL } from "@/lib/talisu/talisu-links";

const NAV_LINK =
  "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-tight ring-1 transition-colors";

type Props = {
  pins: readonly TalisUMktsPin[];
  /** Kept for callers; the panel no longer lists PINs (PIN-only navigation). */
  selectedPinId?: string | null;
  onSelectPin?: (pinId: string) => void;
};

/**
 * Markets left panel (Ralf, Oct 17 2026): PMC intro + "Do More" headline.
 * The Canada market list was removed: every PIN is live, so visitors click a
 * PIN on the map to get where they are going (the Taliswebs USA list would
 * not fit without a scroll bar anyway). "Do More" stays as a headline with
 * its write-up, not as a navigation item.
 */
export default function TalisUMarketsSidebar({ pins }: Props) {
  const t = useT();
  const m = t.markets;
  const descriptions = m.doMoreDescriptions as Record<string, string>;
  const labels = m.pinLabels as Record<string, string>;
  const doMore = useMemo(
    () =>
      pins
        .filter((pin) => pin.kind === "do-more")
        .map((pin) => ({
          id: pin.id,
          label: labels[pin.id] ?? pin.label,
          text: descriptions[pin.id] ?? pin.description ?? "",
        })),
    [pins, descriptions, labels],
  );

  return (
    <aside
      className="pointer-events-none absolute left-2 top-2 z-20 flex max-h-[calc(100%-1rem)] w-[min(92vw,20.5rem)] flex-col sm:left-3 sm:top-3 sm:max-h-[calc(100%-1.5rem)]"
      data-testid="mkts-sidebar"
    >
      <div className="pointer-events-auto flex min-h-0 flex-col overflow-y-auto rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        <div className="px-4 pb-3 pt-3.5">
          <h1 className="text-[17px] font-semibold tracking-tight text-neutral-950">
            {m.pmcTitle}
          </h1>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-neutral-500">
            {m.pmcTagline}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {m.pmcBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-[11.5px] leading-[1.3] text-neutral-800"
              >
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-neutral-800" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {/* Ralf (Oct 18): Canada (this site) / USA (Taliswebs) / Do More
              (Catalogue). Plain anchors: same window, full reload when the
              site changes. */}
          <nav className="mt-3 flex flex-wrap gap-1.5" data-testid="mkts-site-links">
            <a
              href={ROUTES.TALISU_MARKETS}
              aria-current="page"
              className={`${NAV_LINK} bg-neutral-950 text-white ring-neutral-950`}
              data-testid="mkts-link-canada"
            >
              {m.canadaMarkets}
            </a>
            <a
              href={TALISWEBS_US_MARKETS_URL}
              className={`${NAV_LINK} bg-white text-neutral-900 ring-neutral-300 hover:bg-neutral-100`}
              data-testid="mkts-link-usa"
            >
              {m.usaMarkets}
            </a>
            <a
              href={ROUTES.CATALOG}
              className={`${NAV_LINK} bg-white text-neutral-900 ring-neutral-300 hover:bg-neutral-100`}
              data-testid="mkts-link-do-more"
            >
              {m.doMoreLink}
            </a>
          </nav>
        </div>

        <div className="border-t border-neutral-200/80 px-4 pb-3.5 pt-3" data-testid="mkts-do-more">
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">{m.doMore}</h2>
          {doMore.map((item) => (
            <div key={item.id} className="mt-1.5">
              <p className="text-[12px] font-semibold text-neutral-800">{item.label}</p>
              {item.text ? (
                <p className="mt-0.5 text-[11.5px] leading-[1.35] text-neutral-600">{item.text}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
