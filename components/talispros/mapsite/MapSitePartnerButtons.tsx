"use client";

import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";

export type MapSitePartnerTarget = {
  fastCode: string;
  href: string;
  title: string | null;
  /** Seen from the current Mapsite: the other side is its Root, Derivative or a plain partner. */
  relation?: "root" | "derivative" | "partner";
};

/**
 * Partner-linked Mapsites (migration 103): both PINs can't share one map, so
 * each linked Mapsite shows a floating button that opens the other(s).
 */
export default function MapSitePartnerButtons({ partners }: { partners: MapSitePartnerTarget[] }) {
  const m = useT().nav.mapsitesMenu;
  if (partners.length === 0) return null;
  return (
    <div
      data-testid="mapsite-partner-buttons"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-wrap justify-center gap-2 px-4 sm:bottom-6"
    >
      {partners.map((p) => {
        const name = p.title?.trim() || p.fastCode.toUpperCase();
        return (
          <a
            key={p.fastCode}
            data-relation={p.relation ?? "partner"}
            href={p.href}
            data-testid="mapsite-partner-button"
            className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-left shadow-[0_12px_32px_rgba(0,0,0,0.25)] ring-1 ring-black/10 transition hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#046BD9] text-white">
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">
                {p.relation === "root" ? m.rootKicker : m.partnerKicker} · {p.fastCode.toUpperCase()}
              </span>
              <span className="block truncate text-[15px] font-semibold text-neutral-950">
                {fmt(m.partnerOpen, { name })}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
