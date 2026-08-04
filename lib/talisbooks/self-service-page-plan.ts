/**
 * Fixed 22-page plan for self-service (image-upload) TalisBook™ generation.
 *
 * Page map:
 *  1       Lot information (cover)
 *  2–3 … 16–17  Landscape centerfold spreads (up to 8)
 *  18–19   Glasshouse™ full continuous spread + short description
 *  20–21   Closing landscape centerfold (9th landscape when available)
 *  22      Agent / owner details
 *
 * Extra landscapes beyond 9 are ignored. Portraits are not used for spreads.
 */

import { getGlasshouseBrochureSource } from "@/lib/talisbooks/permanent-pages/glasshouse-brochure";

export const SELF_SERVICE_TOTAL_PAGES = 22;
export const SELF_SERVICE_LOT_PAGE = 1;
export const SELF_SERVICE_AGENT_PAGE = 22;
export const SELF_SERVICE_GLASSHOUSE_START = 18;
export const SELF_SERVICE_CLOSING_LANDSCAPE_START = 20;

/** Left-page numbers for interior landscape spreads (pages 2–17). */
export const SELF_SERVICE_INTERIOR_SPREAD_STARTS = [
  2, 4, 6, 8, 10, 12, 14, 16,
] as const;

/** Interior (8) + closing landscape (1). */
export const SELF_SERVICE_MAX_LANDSCAPE_SPREADS =
  SELF_SERVICE_INTERIOR_SPREAD_STARTS.length + 1;

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

export type SelfServicePagePlanInput = {
  title: string;
  description: string;
  location: string;
  /** Landscapes / panoramas in upload order — extras beyond max are ignored. */
  landscapes: SelfServiceLandscapeAsset[];
  /** Cover hero fallback when no landscape exists. */
  coverImageUrl: string | null;
  agent: SelfServiceAgentDetails;
};

export type SelfServicePageRowContent = {
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
};

function centerfoldPair(options: {
  startPage: number;
  slugPrefix: string;
  spreadImageUrl: string | null;
  captionTitle?: string;
  captionBody?: string;
  isPermanent?: boolean;
  systemKey?: string;
}): SelfServicePageRowContent[] {
  const {
    startPage,
    slugPrefix,
    spreadImageUrl,
    captionTitle = "",
    captionBody = "",
    isPermanent,
    systemKey,
  } = options;

  const leftContent: Record<string, unknown> = {
    pageRole: "property_content",
    layout: "centerfold_left",
    title: "",
    body: "",
    heroImageUrl: spreadImageUrl || undefined,
    spreadImageUrl: spreadImageUrl || undefined,
  };
  const rightContent: Record<string, unknown> = {
    pageRole: "property_content",
    layout: "centerfold_right",
    title: captionTitle,
    body: captionBody,
    heroImageUrl: spreadImageUrl || undefined,
    spreadImageUrl: spreadImageUrl || undefined,
  };

  if (isPermanent) {
    leftContent.isPermanent = true;
    leftContent.clientEditable = false;
    rightContent.isPermanent = true;
    rightContent.clientEditable = false;
  }
  if (systemKey) {
    leftContent.systemKey = systemKey;
    leftContent.brochureLeaf = "left";
    rightContent.systemKey = systemKey;
    rightContent.brochureLeaf = "right";
  }

  return [
    {
      title: captionTitle || `Spread ${startPage}-${startPage + 1}`,
      slug: `${slugPrefix}-left`,
      page_number: startPage,
      sort_order: startPage,
      content: leftContent,
    },
    {
      title: captionTitle || `Spread ${startPage}-${startPage + 1}`,
      slug: `${slugPrefix}-right`,
      page_number: startPage + 1,
      sort_order: startPage + 1,
      content: rightContent,
    },
  ];
}

/**
 * Builds the fixed 22-page self-service content rows (no DB book_id yet).
 */
export function buildSelfServiceEbookPageRows(
  input: SelfServicePagePlanInput,
): SelfServicePageRowContent[] {
  const landscapes = input.landscapes.slice(0, SELF_SERVICE_MAX_LANDSCAPE_SPREADS);
  const coverImageUrl =
    input.coverImageUrl || landscapes[0]?.url || null;
  const glasshouse = getGlasshouseBrochureSource();
  const glassHero = glasshouse.left.heroImageUrl;
  const glassCaption = [glasshouse.left.body, glasshouse.right.body]
    .filter(Boolean)
    .join(" ");

  const rows: SelfServicePageRowContent[] = [];

  rows.push({
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
      heroImageUrl: coverImageUrl || undefined,
      coverTemplateId: "horizon-caption",
    },
  });

  SELF_SERVICE_INTERIOR_SPREAD_STARTS.forEach((startPage, index) => {
    const asset = landscapes[index] ?? null;
    rows.push(
      ...centerfoldPair({
        startPage,
        slugPrefix: `landscape-spread-${String(index + 1).padStart(2, "0")}`,
        spreadImageUrl: asset?.url ?? null,
      }),
    );
  });

  rows.push(
    ...centerfoldPair({
      startPage: SELF_SERVICE_GLASSHOUSE_START,
      slugPrefix: "glasshouse-brochure",
      spreadImageUrl: glassHero,
      captionTitle: glasshouse.left.title,
      captionBody: glassCaption || glasshouse.left.body,
      isPermanent: true,
      systemKey: glasshouse.key,
    }),
  );

  const closingLandscape =
    landscapes[SELF_SERVICE_INTERIOR_SPREAD_STARTS.length] ?? null;
  rows.push(
    ...centerfoldPair({
      startPage: SELF_SERVICE_CLOSING_LANDSCAPE_START,
      slugPrefix: "landscape-closing",
      spreadImageUrl: closingLandscape?.url ?? null,
    }),
  );

  const agent = input.agent;
  rows.push({
    title: agent.name || "Agent details",
    slug: "agent-details",
    page_number: SELF_SERVICE_AGENT_PAGE,
    sort_order: SELF_SERVICE_AGENT_PAGE,
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
    },
  });

  return rows.sort((a, b) => a.page_number - b.page_number);
}

/** True when an upload should become a facing landscape spread. */
export function isSelfServiceSpreadCandidate(width: number, height: number): boolean {
  return width > 0 && height > 0 && width > height;
}
