import type { MapSiteDashboardPanelId } from "@/lib/talispros/mapsite-owner-customizations";

/**
 * Mapsite Dashboard tabs (Ralf, Nov 26 walkthrough).
 *
 * Until the first 20 subscribers are live, owners only see the core tools:
 * PIN Dashboard, Listing links and Logo & Card Editor. The advanced tools
 * (Ebook Editor, Bookshelf Editor, PIN Categories, Partner Mapsites) keep all
 * of their code, routes and server actions; they are only hidden from the tab
 * bar. Flip SHOW_ADVANCED_MAPSITE_TABS to true to bring them back.
 */
export const SHOW_ADVANCED_MAPSITE_TABS = false;

export type MapSiteDashboardSectionId = MapSiteDashboardPanelId | "links";

/** Always visible, in tab order. */
export const MAPSITE_CORE_DASHBOARD_SECTIONS = ["pins", "links", "branding"] as const;

/** Hidden while SHOW_ADVANCED_MAPSITE_TABS is false. */
export const MAPSITE_ADVANCED_DASHBOARD_SECTIONS = [
  "ebooks",
  "bookshelf",
  "categories",
  "partners",
] as const;

export const MAPSITE_DEFAULT_DASHBOARD_SECTION: MapSiteDashboardSectionId = "pins";

const ALL_SECTIONS: ReadonlyArray<MapSiteDashboardSectionId> = [
  ...MAPSITE_CORE_DASHBOARD_SECTIONS,
  ...MAPSITE_ADVANCED_DASHBOARD_SECTIONS,
];

export function isKnownMapSiteDashboardSection(
  value: string | null | undefined,
): value is MapSiteDashboardSectionId {
  return Boolean(value) && ALL_SECTIONS.includes(value as MapSiteDashboardSectionId);
}

export function isMapSiteDashboardSectionVisible(
  id: MapSiteDashboardSectionId,
  showAdvanced: boolean = SHOW_ADVANCED_MAPSITE_TABS,
): boolean {
  if ((MAPSITE_CORE_DASHBOARD_SECTIONS as ReadonlyArray<string>).includes(id)) return true;
  return showAdvanced;
}

export function visibleMapSiteDashboardSections(
  showAdvanced: boolean = SHOW_ADVANCED_MAPSITE_TABS,
): MapSiteDashboardSectionId[] {
  return ALL_SECTIONS.filter((id) => isMapSiteDashboardSectionVisible(id, showAdvanced));
}

/**
 * The section to actually open for a request (tab click, ?dashboard= query,
 * deep link). Unknown or hidden sections fall back to the PIN Dashboard so
 * the active tab can never land on a hidden tool.
 */
export function resolveMapSiteDashboardSection(
  requested: string | null | undefined,
  showAdvanced: boolean = SHOW_ADVANCED_MAPSITE_TABS,
): MapSiteDashboardSectionId {
  if (requested === "1" || requested === "true") return MAPSITE_DEFAULT_DASHBOARD_SECTION;
  if (!isKnownMapSiteDashboardSection(requested)) return MAPSITE_DEFAULT_DASHBOARD_SECTION;
  return isMapSiteDashboardSectionVisible(requested, showAdvanced)
    ? requested
    : MAPSITE_DEFAULT_DASHBOARD_SECTION;
}

/** Step colors for the dashboard tabs and the Add Pin stepper. */
export const MAPSITE_DASHBOARD_TAB_ACCENTS: Record<MapSiteDashboardSectionId, string> = {
  pins: "bg-[#046BD9] text-white",
  links: "bg-amber-500 text-white",
  branding: "bg-violet-600 text-white",
  ebooks: "bg-emerald-600 text-white",
  bookshelf: "bg-emerald-600 text-white",
  categories: "bg-sky-600 text-white",
  partners: "bg-rose-600 text-white",
};
