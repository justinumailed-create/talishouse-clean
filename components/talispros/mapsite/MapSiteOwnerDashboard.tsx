"use client";

import { useEffect, type ReactNode } from "react";
import { useT } from "@/lib/i18n/client";
import {
  MAPSITE_DASHBOARD_MENU_ITEMS,
  type MapSiteDashboardPanelId,
} from "@/lib/talispros/mapsite-owner-customizations";
import {
  isMapSiteDashboardSectionVisible,
  MAPSITE_DASHBOARD_TAB_ACCENTS,
  type MapSiteDashboardSectionId,
} from "@/lib/talispros/mapsite-dashboard-tabs";
import { MapSiteDashboardChrome } from "./MapSiteDashboardChrome";

export type { MapSiteDashboardSectionId };

/**
 * Every dashboard tool, in tab order. Core tools (pins, links, branding) are
 * always shown; the rest stay hidden until SHOW_ADVANCED_MAPSITE_TABS is on
 * (see lib/talispros/mapsite-dashboard-tabs.ts). Nothing here is deleted.
 */
export const MAPSITE_DASHBOARD_SECTIONS: ReadonlyArray<{
  id: MapSiteDashboardSectionId;
  menuId?: MapSiteDashboardPanelId;
}> = [
  { id: "pins", menuId: "pins" },
  { id: "links" },
  { id: "branding", menuId: "branding" },
  { id: "ebooks", menuId: "ebooks" },
  { id: "bookshelf", menuId: "bookshelf" },
  { id: "categories", menuId: "categories" },
  { id: "partners", menuId: "partners" },
];

export function isMapSiteDashboardSectionId(
  value: string | null | undefined,
): value is MapSiteDashboardSectionId {
  if (!value) return false;
  return MAPSITE_DASHBOARD_SECTIONS.some((item) => item.id === value);
}

/** Tabs the owner can see right now (core tools, plus advanced when enabled). */
export function visibleMapSiteDashboardTabs(
  showAdvanced?: boolean,
): ReadonlyArray<{ id: MapSiteDashboardSectionId; menuId?: MapSiteDashboardPanelId }> {
  return MAPSITE_DASHBOARD_SECTIONS.filter((item) =>
    isMapSiteDashboardSectionVisible(item.id, showAdvanced),
  );
}

type MapSiteOwnerDashboardProps = {
  fastCode: string;
  section: MapSiteDashboardSectionId;
  onSection: (section: MapSiteDashboardSectionId) => void;
  onBack: () => void;
  onClose: () => void;
  onRestore: () => void;
  /** Pins section keeps the map visible on the right for place/fix. */
  showMap?: boolean;
  children: ReactNode;
};

/**
 * Full-page Mapsite Dashboard (homepage-editor look): section tools, then
 * Restore to previous / Back / Close along the bottom.
 */
export default function MapSiteOwnerDashboard({
  fastCode,
  section,
  onSection,
  onBack,
  onClose,
  onRestore,
  showMap = false,
  children,
}: MapSiteOwnerDashboardProps) {
  const t = useT();
  const copy = t.mapsite.dashboardPage;
  const menu = t.mapsite.dashboardMenu;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function sectionLabel(id: MapSiteDashboardSectionId): string {
    if (id === "links") return copy.links;
    const item = MAPSITE_DASHBOARD_MENU_ITEMS.find((entry) => entry.id === id);
    return (item && menu[item.id]) || item?.label || id;
  }

  const wide = section === "ebooks" || section === "bookshelf";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex"
      data-testid="mapsite-owner-dashboard"
    >
      <div
        className={`pointer-events-auto flex h-full min-h-0 w-full flex-col bg-white text-neutral-950 shadow-2xl ${
          showMap
            ? "sm:max-w-[36rem] lg:max-w-[40rem]"
            : wide
              ? "sm:max-w-[48rem] lg:max-w-[56rem]"
              : "sm:max-w-[40rem] lg:max-w-[44rem]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mapsite-dashboard-title"
      >
        <div className="border-b border-neutral-200 bg-gradient-to-r from-[#046BD9]/10 via-white to-white px-5 py-4">
          <h2
            id="mapsite-dashboard-title"
            className="m-0! text-[18px] font-semibold text-neutral-950!"
          >
            {copy.title}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-neutral-600">
            {copy.intro}{" "}
            <span className="font-mono text-neutral-500">
              FAST Code™ {fastCode.trim().toUpperCase()}
            </span>
          </p>
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label={copy.title}
          >
            {visibleMapSiteDashboardTabs().map((item, index) => {
              const active = item.id === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`mapsite-dashboard-tab-${item.id}`}
                  onClick={() => onSection(item.id)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition sm:text-[13px] ${
                    active
                      ? `${MAPSITE_DASHBOARD_TAB_ACCENTS[item.id]} shadow-sm`
                      : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      active ? "bg-white/25" : MAPSITE_DASHBOARD_TAB_ACCENTS[item.id]
                    }`}
                  >
                    {index + 1}
                  </span>
                  {sectionLabel(item.id)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <h3 className="mb-3 text-[15px] font-semibold text-neutral-950">
            {sectionLabel(section)}
          </h3>
          <MapSiteDashboardChrome embedded>{children}</MapSiteDashboardChrome>
        </div>

        <div className="space-y-2 border-t border-neutral-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onRestore}
              data-testid="mapsite-dashboard-restore"
              className="text-[13px] font-medium text-neutral-600 hover:underline"
            >
              {copy.restore}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                data-testid="mapsite-dashboard-back"
                className="inline-flex min-h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {copy.back}
              </button>
              <button
                type="button"
                onClick={onClose}
                data-testid="mapsite-dashboard-close"
                className="inline-flex min-h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {copy.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
