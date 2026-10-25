"use client";

import type { ReactElement } from "react";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SELECTED,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import { ROUTES } from "@/lib/routes";
import { TALISWEBS_US_MARKETS_URL } from "@/lib/talisu/talisu-links";

/**
 * Market buttons use the metal tabs from Aisha's structure picker
 * (/talisu/reg): the market shown on this page is the selected tab.
 */
const MARKET_BUTTON_SELECTED = `${METAL_TAB} ${METAL_TAB_SELECTED}`;
const MARKET_BUTTON_UNSELECTED = `${METAL_TAB} ${METAL_TAB_UNSELECTED}`;

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
          <nav className="mt-3 flex flex-col gap-2.5" data-testid="mkts-site-links">
            <a
              href={ROUTES.TALISU_MARKETS}
              aria-current="page"
              className={MARKET_BUTTON_SELECTED}
              style={{ backgroundImage: ADVISER_METAL_BG }}
              data-testid="mkts-link-canada"
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={METAL_TAB_LABEL}>{m.canadaMarkets}</span>
            </a>
            <a
              href={TALISWEBS_US_MARKETS_URL}
              className={MARKET_BUTTON_UNSELECTED}
              style={{ backgroundImage: ADVISER_METAL_BG }}
              data-testid="mkts-link-usa"
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={METAL_TAB_LABEL}>{m.usaMarkets}</span>
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
