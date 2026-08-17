/**
 * Single self-service Talisbook™ page planner.
 *
 * One generator, configuration-driven:
 *   facingPages / captions / advertising / globalContent / customContent
 *
 * Upload roles (Level 1):
 *   Image 1  — front cover
 *   Image 2  — back cover
 *   Images 3–20 — interiors (landscape = one two-page spread; portrait = one page)
 *
 * Page count (Level 3):
 *   No Custom + No Global → 22
 *   Only Custom           → 22
 *   Only Global           → 22
 *   Custom + Global       → 24
 */

import { getGlasshouseBrochureSource } from "@/lib/talisbooks/permanent-pages/glasshouse-brochure";
import { isLandscapeSpreadCandidate } from "@/lib/talisbooks/viewer/spread-layout";

export const SELF_SERVICE_MAX_UPLOAD_IMAGES = 20;
export const SELF_SERVICE_MAX_INTERIOR_IMAGES = 18;
export const SELF_SERVICE_DEFAULT_TOTAL_PAGES = 22;
export const SELF_SERVICE_BOTH_CONTENT_TOTAL_PAGES = 24;
/** @deprecated Use selfServicePageCount() — kept for existing imports. */
export const SELF_SERVICE_TOTAL_PAGES = SELF_SERVICE_DEFAULT_TOTAL_PAGES;
export const SELF_SERVICE_LOT_PAGE = 1;
export const SELF_SERVICE_AD_INTRO_START = 16;
export const SELF_SERVICE_GLASSHOUSE_START = 20;
export const SELF_SERVICE_INTERIOR_SPREAD_STARTS = [
  2, 4, 6, 8, 10, 12, 14,
] as const;
export const SELF_SERVICE_MAX_LANDSCAPE_SPREADS =
  SELF_SERVICE_INTERIOR_SPREAD_STARTS.length;

export type SelfServiceLandscapeAsset = {
  url: string;
  width: number;
  height: number;
};

export type SelfServiceAgentDetails = {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  brokerageLogoUrl?: string;
  brokerageName?: string;
  brokerageLine?: string;
};

export type SelfServiceBookOptions = {
  facingPages: boolean;
  captions: boolean;
  advertising: boolean;
  globalContent: boolean;
  customContent: boolean;
};

export const DEFAULT_SELF_SERVICE_BOOK_OPTIONS: SelfServiceBookOptions = {
  facingPages: true,
  captions: false,
  advertising: false,
  globalContent: false,
  customContent: false,
};

export type SelfServicePageCaption = {
  text: string;
  skipped: boolean;
};

export type SelfServicePagePlanInput = {
  title: string;
  description: string;
  location: string;
  /** Interior facing images (uploads 3–20) when facingPages is on. */
  landscapes: SelfServiceLandscapeAsset[];
  coverImageUrl: string | null;
  backCoverImageUrl?: string | null;
  agent: SelfServiceAgentDetails;
  options?: Partial<SelfServiceBookOptions>;
  /** Captions aligned to interior facing pages (uploads 3–20 / book interiors). */
  captions?: SelfServicePageCaption[];
  /**
   * Legacy flag — maps onto customContent when `options` is omitted.
   * @deprecated Use options.customContent
   */
  includeAdIntroSection?: boolean;
};

export type SelfServicePageRowContent = {
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
};

export function resolveSelfServiceBookOptions(
  input?: Partial<SelfServiceBookOptions> | null,
  legacyIncludeAdIntro?: boolean,
): SelfServiceBookOptions {
  return {
    facingPages: input?.facingPages ?? true,
    captions: input?.captions ?? false,
    advertising: input?.advertising ?? false,
    globalContent: input?.globalContent ?? false,
    customContent:
      input?.customContent ?? (legacyIncludeAdIntro !== undefined ? legacyIncludeAdIntro : false),
  };
}

export function selfServicePageCount(options: SelfServiceBookOptions): number {
  return options.customContent && options.globalContent
    ? SELF_SERVICE_BOTH_CONTENT_TOTAL_PAGES
    : SELF_SERVICE_DEFAULT_TOTAL_PAGES;
}

export function parseSelfServiceBookOptions(
  raw: string | null | undefined,
): SelfServiceBookOptions {
  if (!raw?.trim()) return { ...DEFAULT_SELF_SERVICE_BOOK_OPTIONS };
  try {
    const parsed = JSON.parse(raw) as Partial<SelfServiceBookOptions>;
    return resolveSelfServiceBookOptions(parsed);
  } catch {
    return { ...DEFAULT_SELF_SERVICE_BOOK_OPTIONS };
  }
}

export function parseSelfServiceCaptions(
  raw: string | null | undefined,
): SelfServicePageCaption[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      if (!item || typeof item !== "object") {
        return { text: "", skipped: true };
      }
      const record = item as Record<string, unknown>;
      const skipped = record.skipped === true;
      const text = typeof record.text === "string" ? record.text.trim() : "";
      return { text, skipped };
    });
  } catch {
    return [];
  }
}

function facingPageRow(options: {
  pageNumber: number;
  slug: string;
  imageUrl: string | null;
  captionsEnabled: boolean;
  caption?: SelfServicePageCaption | null;
  leaf: "left" | "right";
}): SelfServicePageRowContent {
  const skipped = options.caption?.skipped === true;
  const captionText = skipped ? "" : options.caption?.text?.trim() || "";
  return {
    title: captionText || `Page ${options.pageNumber}`,
    slug: options.slug,
    page_number: options.pageNumber,
    sort_order: options.pageNumber,
    content: {
      pageRole: "property_content",
      layout: "facing",
      layoutType: "single",
      title: captionText,
      body: "",
      heroImageUrl: options.imageUrl || undefined,
      captionsEnabled: options.captionsEnabled,
      captionSkipped: skipped,
      captionAlign: "right",
      brochureLeaf: options.leaf,
    },
  };
}

function landscapeSpreadPair(options: {
  startPage: number;
  slugPrefix: string;
  imageUrl: string;
  captionsEnabled: boolean;
  caption?: SelfServicePageCaption | null;
}): SelfServicePageRowContent[] {
  const skipped = options.caption?.skipped === true;
  const captionText = skipped ? "" : options.caption?.text?.trim() || "";
  return [
    {
      title: captionText || `Spread ${options.startPage}`,
      slug: `${options.slugPrefix}-left`,
      page_number: options.startPage,
      sort_order: options.startPage,
      content: {
        pageRole: "property_content",
        layout: "centerfold_left",
        layoutType: "spread",
        title: captionText,
        body: "",
        spreadImageUrl: options.imageUrl,
        spreadMat: true,
        captionsEnabled: options.captionsEnabled,
        captionSkipped: skipped,
        brochureLeaf: "left",
      },
    },
    {
      title: captionText || `Spread ${options.startPage + 1}`,
      slug: `${options.slugPrefix}-right`,
      page_number: options.startPage + 1,
      sort_order: options.startPage + 1,
      content: {
        pageRole: "property_content",
        layout: "centerfold_right",
        layoutType: "spread",
        title: captionText,
        body: "",
        spreadImageUrl: options.imageUrl,
        spreadMat: true,
        captionsEnabled: options.captionsEnabled,
        captionSkipped: skipped,
        brochureLeaf: "right",
      },
    },
  ];
}

function blankFacingPair(startPage: number, slugPrefix: string): SelfServicePageRowContent[] {
  return [
    facingPageRow({
      pageNumber: startPage,
      slug: `${slugPrefix}-left`,
      imageUrl: null,
      captionsEnabled: false,
      leaf: "left",
    }),
    facingPageRow({
      pageNumber: startPage + 1,
      slug: `${slugPrefix}-right`,
      imageUrl: null,
      captionsEnabled: false,
      leaf: "right",
    }),
  ];
}

function customContentRows(options: {
  startPage: number;
  agent: SelfServiceAgentDetails;
  advertising: boolean;
  description: string;
}): SelfServicePageRowContent[] {
  const agent = options.agent;
  const brokerageName = agent.brokerageName?.trim() || "Talispros™";
  const kicker = options.advertising ? "Advertisement" : undefined;
  return [
    {
      title: kicker || brokerageName,
      slug: "custom-content-left",
      page_number: options.startPage,
      sort_order: options.startPage,
      content: {
        pageRole: "agent_brokerage",
        layout: "custom_content",
        title: brokerageName,
        body: agent.brokerageLine?.trim() || options.description,
        agentName: agent.name,
        agentTitle: agent.title,
        agentPhone: agent.phone,
        agentEmail: agent.email,
        agentPhotoUrl: agent.photoUrl,
        brokerageName,
        brokerageLine: agent.brokerageLine,
        brokerageLogoUrl: agent.brokerageLogoUrl,
        advertisement: options.advertising,
        advertisementLabel: kicker,
        brochureLeaf: "left",
        systemKey: "custom_root_content",
      },
    },
    {
      title: "Listing contact",
      slug: "custom-content-right",
      page_number: options.startPage + 1,
      sort_order: options.startPage + 1,
      content: {
        pageRole: "property_content",
        layout: "custom_content",
        title: agent.name || "Listing contact",
        body: options.description,
        agentName: agent.name,
        agentTitle: agent.title || "Property owner",
        agentPhone: agent.phone,
        agentEmail: agent.email,
        agentPhotoUrl: agent.photoUrl,
        brokerageLogoUrl: agent.brokerageLogoUrl,
        brokerageName,
        advertisement: false,
        brochureLeaf: "right",
        systemKey: "custom_root_content",
      },
    },
  ];
}

function globalContentRows(options: {
  startPage: number;
  advertising: boolean;
}): SelfServicePageRowContent[] {
  const glasshouse = getGlasshouseBrochureSource();
  const kicker = options.advertising ? "Advertisement" : undefined;
  const caption = [glasshouse.left.body, glasshouse.pricingLine]
    .filter(Boolean)
    .join(" ");
  return [
    {
      title: kicker || glasshouse.left.title,
      slug: "global-content-left",
      page_number: options.startPage,
      sort_order: options.startPage,
      content: {
        pageRole: "property_content",
        layout: "global_content",
        title: glasshouse.left.title,
        body: caption,
        heroImageUrl: glasshouse.spreadImageUrl,
        spreadImageUrl: glasshouse.spreadImageUrl,
        pricingLine: glasshouse.pricingLine,
        disclaimer: glasshouse.disclaimer,
        advertisement: options.advertising,
        advertisementLabel: kicker,
        isPermanent: true,
        clientEditable: false,
        systemKey: glasshouse.key,
        brochureLeaf: "left",
      },
    },
    {
      title: glasshouse.right.title,
      slug: "global-content-right",
      page_number: options.startPage + 1,
      sort_order: options.startPage + 1,
      content: {
        pageRole: "property_content",
        layout: "global_content",
        title: glasshouse.right.title,
        body: glasshouse.right.body,
        heroImageUrl: glasshouse.spreadImageUrl,
        spreadImageUrl: glasshouse.spreadImageUrl,
        pricingLine: glasshouse.pricingLine,
        disclaimer: glasshouse.disclaimer,
        advertisement: false,
        isPermanent: true,
        clientEditable: false,
        systemKey: glasshouse.key,
        brochureLeaf: "right",
      },
    },
  ];
}

function coverRow(input: SelfServicePagePlanInput): SelfServicePageRowContent {
  const agent = input.agent;
  return {
    title: input.title,
    slug: "lot-info",
    page_number: SELF_SERVICE_LOT_PAGE,
    sort_order: SELF_SERVICE_LOT_PAGE,
    content: {
      pageRole: "cover",
      layout: "cover",
      title: input.title,
      subtitle: input.location || "Lot information",
      body: input.description,
      address: input.location || undefined,
      heroImageUrl: input.coverImageUrl || undefined,
      coverTemplateId: "horizon-caption",
      agentName: agent.name,
      agentTitle: agent.title,
      agentPhone: agent.phone,
      agentEmail: agent.email,
      agentPhotoUrl: agent.photoUrl,
      brokerageLogoUrl: agent.brokerageLogoUrl,
      brokerageName: agent.brokerageName || "Talispros™",
      brokerageLine: agent.brokerageLine || input.location || undefined,
    },
  };
}

function backCoverRow(
  input: SelfServicePagePlanInput,
  pageNumber: number,
): SelfServicePageRowContent {
  const agent = input.agent;
  const backCoverImageUrl =
    input.backCoverImageUrl?.trim() || input.coverImageUrl || null;
  return {
    title: agent.name || "Agent details",
    slug: "agent-details",
    page_number: pageNumber,
    sort_order: pageNumber,
    content: {
      pageRole: "agent_brokerage",
      layout: "agent_summary",
      title: "Agent details",
      agentName: agent.name,
      agentTitle: agent.title,
      agentPhone: agent.phone,
      agentEmail: agent.email,
      agentPhotoUrl: agent.photoUrl,
      brokerageLogoUrl: agent.brokerageLogoUrl,
      brokerageName: agent.brokerageName || "Talispros™",
      brokerageLine: agent.brokerageLine || input.location || undefined,
      address: input.location || undefined,
      body: input.description || undefined,
      heroImageUrl: backCoverImageUrl || undefined,
    },
  };
}

/**
 * Builds content rows for the configured self-service book.
 * Page numbers are always contiguous from 1.
 */
export function buildSelfServiceEbookPageRows(
  input: SelfServicePagePlanInput,
): SelfServicePageRowContent[] {
  const options = resolveSelfServiceBookOptions(
    input.options,
    input.includeAdIntroSection,
  );
  const totalPages = selfServicePageCount(options);
  const interiors = input.landscapes.slice(0, SELF_SERVICE_MAX_INTERIOR_IMAGES);
  const rows: SelfServicePageRowContent[] = [];

  rows.push(coverRow(input));

  let cursor = 2;
  if (options.customContent) {
    rows.push(
      ...customContentRows({
        startPage: cursor,
        agent: input.agent,
        advertising: options.advertising,
        description: input.description,
      }),
    );
    cursor += 2;
  }

  const backCoverPage = totalPages;
  // Reserve the inside-back spread for Global content, or blank endpapers
  // when neither Custom nor Global is on (keeps the 22-page base).
  const reserveInsideBack = options.globalContent || !options.customContent;
  const interiorEnd = backCoverPage - 1 - (reserveInsideBack ? 2 : 0);
  let pageCursor = cursor;
  let imageIndex = 0;
  let spreadIndex = 0;

  while (pageCursor <= interiorEnd) {
    const remaining = interiorEnd - pageCursor + 1;
    const asset = interiors[imageIndex] ?? null;
    const leaf: "left" | "right" = pageCursor % 2 === 0 ? "left" : "right";
    const caption = options.captions ? input.captions?.[imageIndex] ?? null : null;
    const asSpread =
      Boolean(asset) &&
      options.facingPages !== false &&
      isLandscapeSpreadCandidate(asset!.width, asset!.height);

    if (asSpread && asset) {
      if (pageCursor % 2 === 1) {
        rows.push(
          facingPageRow({
            pageNumber: pageCursor,
            slug: `facing-pad-${pageCursor}`,
            imageUrl: null,
            captionsEnabled: false,
            leaf: "right",
          }),
        );
        pageCursor += 1;
        continue;
      }
      if (remaining < 2) {
        rows.push(
          facingPageRow({
            pageNumber: pageCursor,
            slug: `facing-${String(imageIndex + 1).padStart(2, "0")}`,
            imageUrl: asset.url,
            captionsEnabled: options.captions,
            caption,
            leaf,
          }),
        );
        pageCursor += 1;
        imageIndex += 1;
        continue;
      }
      spreadIndex += 1;
      rows.push(
        ...landscapeSpreadPair({
          startPage: pageCursor,
          slugPrefix: `spread-${String(spreadIndex).padStart(2, "0")}`,
          imageUrl: asset.url,
          captionsEnabled: options.captions,
          caption,
        }),
      );
      pageCursor += 2;
      imageIndex += 1;
      continue;
    }

    rows.push(
      facingPageRow({
        pageNumber: pageCursor,
        slug: `facing-${String(imageIndex + 1).padStart(2, "0")}`,
        imageUrl: asset?.url ?? null,
        captionsEnabled: options.captions && Boolean(asset),
        caption: asset ? caption : null,
        leaf,
      }),
    );
    pageCursor += 1;
    if (asset) imageIndex += 1;
  }

  if (options.globalContent) {
    rows.push(
      ...globalContentRows({
        startPage: backCoverPage - 2,
        advertising: options.advertising,
      }),
    );
  } else if (reserveInsideBack) {
    rows.push(...blankFacingPair(backCoverPage - 2, "endpaper"));
  }

  rows.push(backCoverRow(input, backCoverPage));

  return rows.sort((a, b) => a.page_number - b.page_number);
}

/** True when an upload should become a two-page landscape spread. */
export function isSelfServiceSpreadCandidate(width: number, height: number): boolean {
  return isLandscapeSpreadCandidate(width, height);
}

/** Interior facing pages that accept captions (uploads 3–20). */
export function captionableInteriorCount(
  options?: SelfServiceBookOptions,
): number {
  void options;
  return SELF_SERVICE_MAX_INTERIOR_IMAGES;
}

/**
 * Upload order (Level 1):
 *   1 → front cover
 *   2 → back cover
 *   3–20 → interiors (landscape spreads / portrait singles)
 */
export function assignFacingUploadRoles(
  items: Array<{ url: string; width: number; height: number }>,
): {
  landscapes: SelfServiceLandscapeAsset[];
  coverImageUrl: string | null;
  backCoverImageUrl: string | null;
  galleryUrls: string[];
} {
  const landscapes: SelfServiceLandscapeAsset[] = [];
  const galleryUrls: string[] = [];
  let coverImageUrl: string | null = null;
  let backCoverImageUrl: string | null = null;

  for (const item of items) {
    if (!item.url || item.width <= 0 || item.height <= 0) continue;
    galleryUrls.push(item.url);
    if (!coverImageUrl) {
      coverImageUrl = item.url;
      continue;
    }
    if (!backCoverImageUrl) {
      backCoverImageUrl = item.url;
      continue;
    }
    if (landscapes.length < SELF_SERVICE_MAX_INTERIOR_IMAGES) {
      landscapes.push(item);
    }
  }

  if (!coverImageUrl) {
    coverImageUrl = landscapes[0]?.url ?? null;
  }

  return { landscapes, coverImageUrl, backCoverImageUrl, galleryUrls };
}
