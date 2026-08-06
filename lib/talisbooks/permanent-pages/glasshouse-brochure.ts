/**
 * Permanent Glasshouse™ brochure closing pages.
 *
 * Always appear as the last two pages before the back cover in every Talisbook™.
 * Clients cannot edit them. Administrators replace the global source later
 * (see setGlasshouseBrochureSourceOverride) without rewriting each book.
 */

import type { TalisBooksViewerPage } from "../viewer/types";

export const TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY = "glasshouse_brochure";
export const TALISBOOKS_GLASSHOUSE_BROCHURE_PAGE_COUNT = 2;

export type TalisBooksGlasshouseBrochureLeaf = "left" | "right";

export interface TalisBooksGlasshouseBrochureLeafSource {
  title: string;
  body: string;
  heroImageUrl: string;
}

export interface TalisBooksGlasshouseBrochureSource {
  key: typeof TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY;
  label: string;
  left: TalisBooksGlasshouseBrochureLeafSource;
  right: TalisBooksGlasshouseBrochureLeafSource;
}

const DEFAULT_GLASSHOUSE_BROCHURE: TalisBooksGlasshouseBrochureSource = {
  key: TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
  label: "Glasshouse™ brochure",
  left: {
    title: "Glasshouse™",
    body: "160 and 200 sq. ft. Modular glass-enclosed spaces. Permanent installation. Up in a day, finished in a week. Lease-To-Own available, OAC.",
    heroImageUrl: "/images/glasshouse/hero.png",
  },
  right: {
    title: "Glasshouse™ 200",
    body: "Open concept. One, two, or three sides of glass. Built for views, short-term stays, and home offices — finished open space you complete to taste.",
    heroImageUrl: "/images/glasshouse/models/200.png",
  },
};

/** Runtime admin override — replace globally without republishing every book. */
let glasshouseBrochureOverride: Partial<{
  left: Partial<TalisBooksGlasshouseBrochureLeafSource>;
  right: Partial<TalisBooksGlasshouseBrochureLeafSource>;
  label: string;
}> | null = null;

/**
 * Admin hook: replace Glasshouse brochure assets/copy globally.
 * Pass null to restore the built-in default.
 */
export function setGlasshouseBrochureSourceOverride(
  override: typeof glasshouseBrochureOverride,
): void {
  glasshouseBrochureOverride = override;
}

export function getGlasshouseBrochureSource(): TalisBooksGlasshouseBrochureSource {
  const left = {
    ...DEFAULT_GLASSHOUSE_BROCHURE.left,
    ...glasshouseBrochureOverride?.left,
  };
  const right = {
    ...DEFAULT_GLASSHOUSE_BROCHURE.right,
    ...glasshouseBrochureOverride?.right,
  };
  return {
    key: TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
    label: glasshouseBrochureOverride?.label ?? DEFAULT_GLASSHOUSE_BROCHURE.label,
    left,
    right,
  };
}

export function isPermanentViewerPage(
  page: Pick<TalisBooksViewerPage, "isPermanent" | "clientEditable" | "systemKey">,
): boolean {
  return (
    page.isPermanent === true ||
    page.clientEditable === false ||
    page.systemKey === TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY
  );
}

export function isGlasshouseBrochurePage(
  page: Pick<TalisBooksViewerPage, "systemKey">,
): boolean {
  return page.systemKey === TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY;
}

function leafFromSource(
  leaf: TalisBooksGlasshouseBrochureLeaf,
  pageNumber: number,
  source: TalisBooksGlasshouseBrochureSource,
): TalisBooksViewerPage {
  const content = leaf === "left" ? source.left : source.right;
  return {
    id: `system-${TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY}-${leaf}`,
    pageNumber,
    pageRole: "property_content",
    layout: "full_bleed",
    title: content.title,
    body: content.body,
    heroImageUrl: content.heroImageUrl,
    isPermanent: true,
    clientEditable: false,
    systemKey: TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
    brochureLeaf: leaf,
  };
}

/** Build the two permanent brochure pages starting at `startPageNumber`. */
export function createGlasshouseBrochurePages(
  startPageNumber: number,
): TalisBooksViewerPage[] {
  const source = getGlasshouseBrochureSource();
  return [
    leafFromSource("left", startPageNumber, source),
    leafFromSource("right", startPageNumber + 1, source),
  ];
}

/**
 * DB / content JSON payload for one brochure leaf (auto-draft + Mapsite™ seeds).
 */
export function glasshouseBrochureContentPayload(
  leaf: TalisBooksGlasshouseBrochureLeaf,
): Record<string, unknown> {
  const source = getGlasshouseBrochureSource();
  const content = leaf === "left" ? source.left : source.right;
  return {
    pageRole: "property_content",
    layout: "full_bleed",
    title: content.title,
    body: content.body,
    heroImageUrl: content.heroImageUrl,
    isPermanent: true,
    clientEditable: false,
    systemKey: TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
    brochureLeaf: leaf,
  };
}

export function createGlasshouseBrochureDbRows(options: {
  startPageNumber: number;
  now?: string;
  bookId?: string;
}): Array<{
  book_id?: string;
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}> {
  const now = options.now ?? new Date().toISOString();
  const source = getGlasshouseBrochureSource();
  const leaves: TalisBooksGlasshouseBrochureLeaf[] = ["left", "right"];

  return leaves.map((leaf, index) => {
    const pageNumber = options.startPageNumber + index;
    const content = leaf === "left" ? source.left : source.right;
    return {
      ...(options.bookId ? { book_id: options.bookId } : {}),
      title: content.title,
      slug: `glasshouse-brochure-${leaf}`,
      page_number: pageNumber,
      sort_order: pageNumber,
      content: glasshouseBrochureContentPayload(leaf),
      is_visible: true,
      created_at: now,
      updated_at: now,
    };
  });
}

function isBackCoverPage(page: TalisBooksViewerPage, index: number, total: number): boolean {
  if (total <= 0) return false;
  if (index !== total - 1) return false;
  return page.pageRole === "cover" || page.layout === "cover" || page.layout === "parting";
}

/**
 * Re-apply global brochure assets onto permanent markers (admin replace path).
 */
export function hydratePermanentViewerPages(
  pages: TalisBooksViewerPage[],
): TalisBooksViewerPage[] {
  const source = getGlasshouseBrochureSource();
  return pages.map((page) => {
    if (!isGlasshouseBrochurePage(page)) {
      return page;
    }
    const leaf: TalisBooksGlasshouseBrochureLeaf =
      page.brochureLeaf === "right" ? "right" : "left";
    const content = leaf === "left" ? source.left : source.right;
    return {
      ...page,
      title: content.title,
      body: content.body,
      heroImageUrl: content.heroImageUrl,
      layout: "full_bleed",
      pageRole: "property_content",
      isPermanent: true,
      clientEditable: false,
      systemKey: TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
      brochureLeaf: leaf,
    };
  });
}

/**
 * Ensure Glasshouse brochure pages sit immediately before the back cover.
 * Idempotent: strips prior brochure markers, inserts fresh ones, renumbers.
 */
export function ensurePermanentClosingPages(
  pages: TalisBooksViewerPage[],
): TalisBooksViewerPage[] {
  if (pages.length === 0) {
    return pages;
  }

  const withoutBrochure = pages.filter((page) => !isGlasshouseBrochurePage(page));
  if (withoutBrochure.length === 0) {
    return createGlasshouseBrochurePages(1);
  }

  const lastIndex = withoutBrochure.length - 1;
  const last = withoutBrochure[lastIndex]!;
  const hasBackCover = isBackCoverPage(last, lastIndex, withoutBrochure.length);

  const head = hasBackCover ? withoutBrochure.slice(0, -1) : withoutBrochure;
  const back = hasBackCover ? [last] : [];
  const brochureStart = head.length + 1;
  const brochure = createGlasshouseBrochurePages(brochureStart);

  const merged = [...head, ...brochure, ...back];
  return hydratePermanentViewerPages(
    merged.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
    })),
  );
}
