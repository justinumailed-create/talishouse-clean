"use client";

import type { ReactElement } from "react";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import { TALISWEBS_US_MARKETS_URL } from "@/lib/talisu/talisu-links";

/**
 * Market buttons share the Thorsten P (/talisu/engage) CTA shape: full pill,
 * min 48px tall, 15–16px semibold label with a trailing arrow. The market
 * shown on this page uses the primary (filled blue) style; the other market
 * uses the secondary (white, blue outline) style.
 */
const MARKET_BUTTON =
  "inline-flex min-h-12 w-full flex-wrap items-center justify-center gap-x-2 rounded-full px-6 py-2 text-center text-[15px] font-semibold transition sm:text-[16px]";
const MARKET_BUTTON_PRIMARY = `${MARKET_BUTTON} bg-[#046BD9] text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3]`;
const MARKET_BUTTON_SECONDARY = `${MARKET_BUTTON} bg-white text-[#046BD9] shadow-sm ring-1 ring-inset ring-[#046BD9]/40 hover:bg-[#046BD9]/5`;

type Props = {
  /** Kept for callers; the panel no longer lists PINs (PIN-only navigation). */
  pins?: readonly TalisUMktsPin[];
  selectedPinId?: string | null;
  onSelectPin?: (pinId: string) => void;
};

/**
 * Markets left panel: PMC title and tagline, the market buttons (stacked,
 * full width), then the PMC bullets. Every PIN is live, so visitors click a
 * PIN on the map to get where they are going.
 */
const TalisUMarketsSidebar: (props: Props) => ReactElement = () => {
  const t = useT();
  const m = t.markets;

  return (
    <aside
      className="relative z-20 flex w-full flex-col p-3 lg:pointer-events-none lg:absolute lg:left-3 lg:top-3 lg:max-h-[calc(100%-1.5rem)] lg:w-[min(92vw,20.5rem)] lg:p-0"
      data-testid="mkts-sidebar"
    >
      <div className="pointer-events-auto flex min-h-0 flex-col overflow-y-auto rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        <div className="px-4 pb-4 pt-3.5">
          <h1 className="text-[17px] font-semibold tracking-tight text-neutral-950">
            {m.pmcTitle}
          </h1>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-neutral-500">
            {m.pmcTagline}
          </p>
          {/* Canada (this site) / USA (Taliswebs). Plain anchors: same window,
              full reload when the site changes. */}
          <nav className="mt-3 flex flex-col gap-2" data-testid="mkts-site-links">
            <a
              href={ROUTES.TALISU_MARKETS}
              aria-current="page"
              className={MARKET_BUTTON_PRIMARY}
              data-testid="mkts-link-canada"
            >
              <span className="whitespace-nowrap">{m.canadaMarkets}</span>
              <span aria-hidden>→</span>
            </a>
            <a
              href={TALISWEBS_US_MARKETS_URL}
              className={MARKET_BUTTON_SECONDARY}
              data-testid="mkts-link-usa"
            >
              <span className="whitespace-nowrap">{m.usaMarkets}</span>
              <span aria-hidden>→</span>
            </a>
          </nav>
          <ul className="mt-3.5 space-y-1.5">
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
        </div>
      </div>
    </aside>
  );
};

export default TalisUMarketsSidebar;
