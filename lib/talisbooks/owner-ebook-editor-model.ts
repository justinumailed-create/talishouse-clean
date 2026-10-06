/**
 * Owner Ebook Editor model (pure — shared by client + server).
 *
 * Talisbooks™ pages live in talisbooks_book_pages.content (JSONB). The viewer
 * reads the whitelisted keys below; the editor exposes exactly those so every
 * component the data model supports can be edited without HTML editing.
 */

export const OWNER_EBOOK_TEXT_FIELDS = [
  { key: "title", label: "Title", multiline: false },
  { key: "body", label: "Body text", multiline: true },
  { key: "signoff", label: "Sign-off", multiline: true },
  { key: "slogan", label: "Slogan", multiline: false },
  { key: "mission", label: "Mission", multiline: true },
  { key: "pricingLine", label: "Pricing line", multiline: false },
  { key: "disclaimer", label: "Disclaimer", multiline: true },
  { key: "address", label: "Address", multiline: false },
  { key: "agentName", label: "Agent name", multiline: false },
  { key: "agentTitle", label: "Agent title", multiline: false },
  { key: "agentPhone", label: "Agent phone", multiline: false },
  { key: "agentEmail", label: "Agent email", multiline: false },
  { key: "brokerageName", label: "Brokerage name", multiline: false },
  { key: "brokerageLine", label: "Brokerage line", multiline: false },
  { key: "advertisementLabel", label: "Advertisement label", multiline: false },
] as const;

export const OWNER_EBOOK_IMAGE_FIELDS = [
  { key: "spreadImageUrl", label: "Spread image" },
  { key: "heroImageUrl", label: "Page image" },
  { key: "agentPhotoUrl", label: "Agent photo" },
  { key: "brokerageLogoUrl", label: "Brokerage logo" },
] as const;

export type OwnerEbookTextKey = (typeof OWNER_EBOOK_TEXT_FIELDS)[number]["key"];
export type OwnerEbookImageKey = (typeof OWNER_EBOOK_IMAGE_FIELDS)[number]["key"];

export const OWNER_EBOOK_TEXT_MAX = 8000;

export type OwnerEbookPage = {
  id: string;
  pageNumber: number;
  slug: string;
  layout: string;
  templateId: string | null;
  /** Locked system / brochure pages (shown read-only). */
  locked: boolean;
  text: Partial<Record<OwnerEbookTextKey, string>>;
  images: Partial<Record<OwnerEbookImageKey, string>>;
  captionsEnabled: boolean;
};

export type OwnerEbookDetails = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
  publishStatus: string;
  pageCount: number;
  fastCode: string;
};

/** One editable unit: a single page, or a centerfold left+right spread. */
export type OwnerEbookUnit = {
  key: string;
  kind: "front-cover" | "back-cover" | "spread" | "page";
  pages: OwnerEbookPage[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isLockedPageContent(content: Record<string, unknown>): boolean {
  return (
    content.isPermanent === true ||
    content.clientEditable === false ||
    typeof content.systemKey === "string"
  );
}

export function ownerEbookPageFromRow(row: {
  id: string;
  page_number: number;
  slug: string | null;
  title: string | null;
  content: unknown;
}): OwnerEbookPage {
  const content = record(row.content);
  const text: OwnerEbookPage["text"] = {};
  for (const field of OWNER_EBOOK_TEXT_FIELDS) {
    const value = content[field.key];
    if (typeof value === "string") text[field.key] = value;
  }
  if (text.title === undefined && row.title) text.title = row.title;
  const images: OwnerEbookPage["images"] = {};
  for (const field of OWNER_EBOOK_IMAGE_FIELDS) {
    const value = content[field.key];
    if (typeof value === "string" && value.trim()) images[field.key] = value;
  }
  return {
    id: row.id,
    pageNumber: row.page_number,
    slug: row.slug || "",
    layout: typeof content.layout === "string" ? content.layout : "caption",
    templateId: typeof content.templateId === "string" ? content.templateId : null,
    locked: isLockedPageContent(content),
    text,
    images,
    captionsEnabled: content.captionsEnabled === true,
  };
}

/**
 * Group pages into editable units. A centerfold_left directly followed by a
 * centerfold_right is one spread (moved / deleted together). The first and
 * last cover pages are pinned.
 */
export function groupOwnerEbookUnits(pages: OwnerEbookPage[]): OwnerEbookUnit[] {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const units: OwnerEbookUnit[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]!;
    const next = sorted[index + 1];
    if (index === 0 && page.layout === "cover") {
      units.push({ key: page.id, kind: "front-cover", pages: [page] });
      continue;
    }
    if (index === sorted.length - 1 && page.layout === "cover" && sorted.length > 1) {
      units.push({ key: page.id, kind: "back-cover", pages: [page] });
      continue;
    }
    if (page.layout === "centerfold_left" && next?.layout === "centerfold_right") {
      units.push({ key: page.id, kind: "spread", pages: [page, next] });
      index += 1;
      continue;
    }
    units.push({ key: page.id, kind: "page", pages: [page] });
  }
  return units;
}

export function isMovableUnit(unit: OwnerEbookUnit): boolean {
  return (
    unit.kind !== "front-cover" &&
    unit.kind !== "back-cover" &&
    !unit.pages.some((page) => page.locked)
  );
}

/** Flatten units back to page ids (for reorder). */
export function flattenUnits(units: OwnerEbookUnit[]): string[] {
  return units.flatMap((unit) => unit.pages.map((page) => page.id));
}

/** Move a movable unit one step, never past pinned covers or locked units. */
export function moveUnit(
  units: OwnerEbookUnit[],
  key: string,
  delta: -1 | 1,
): OwnerEbookUnit[] {
  const from = units.findIndex((unit) => unit.key === key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= units.length) return units;
  if (!isMovableUnit(units[from]!) || !isMovableUnit(units[to]!)) return units;
  const next = [...units];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** Validate a text/image patch against the whitelist. */
export function sanitizeOwnerPagePatch(input: {
  text?: Record<string, unknown> | null;
  images?: Record<string, unknown> | null;
  captionsEnabled?: unknown;
}): {
  text: Partial<Record<OwnerEbookTextKey, string>>;
  images: Partial<Record<OwnerEbookImageKey, string>>;
  captionsEnabled?: boolean;
} {
  const text: Partial<Record<OwnerEbookTextKey, string>> = {};
  for (const field of OWNER_EBOOK_TEXT_FIELDS) {
    const value = input.text?.[field.key];
    if (typeof value === "string") text[field.key] = value.slice(0, OWNER_EBOOK_TEXT_MAX);
  }
  const images: Partial<Record<OwnerEbookImageKey, string>> = {};
  for (const field of OWNER_EBOOK_IMAGE_FIELDS) {
    const value = input.images?.[field.key];
    if (typeof value === "string" && value.trim()) images[field.key] = value.trim();
  }
  return {
    text,
    images,
    ...(typeof input.captionsEnabled === "boolean"
      ? { captionsEnabled: input.captionsEnabled }
      : {}),
  };
}
