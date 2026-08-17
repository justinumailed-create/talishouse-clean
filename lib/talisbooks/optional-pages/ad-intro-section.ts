/**
 * Optional advertising + intro section for any Talisbook™.
 *
 * 4 pages / 2 spreads (client-editable — not permanent):
 *  1–2  Advertising spread — user can place any creative (not tied to uploads)
 *  3–4  Inside-back spread (immediately before Glasshouse™):
 *       Left  — company + agent info
 *       Right — framed intro quote
 */

import type { TalisBooksViewerPage } from "../viewer/types";

export const TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY = "optional_ad_intro";
export const TALISBOOKS_AD_INTRO_SECTION_PAGE_COUNT = 4;

/** Agent / company fields used on the inside-back left page. */
export type AdIntroAgentDetails = {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  brokerageLogoUrl?: string;
  brokerageName?: string;
  brokerageLine?: string;
};

export type AdIntroSectionLeaf =
  | "ad_left"
  | "ad_right"
  | "company_agent_left"
  | "quote_right";

export type AdIntroSectionContentPayload = {
  pageRole: "property_content" | "agent_brokerage";
  layout: "full_bleed" | "quote" | "agent_intro";
  title: string;
  body: string;
  heroImageUrl?: string;
  agentName?: string;
  agentTitle?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentPhotoUrl?: string;
  brokerageName?: string;
  brokerageLine?: string;
  brokerageLogoUrl?: string;
  slogan?: string;
  mission?: string;
  isPermanent: false;
  clientEditable: true;
  systemKey: typeof TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY;
  brochureLeaf: "left" | "right";
  sectionLeaf: AdIntroSectionLeaf;
};

const DEFAULT_QUOTE_TITLE = "Introduction";
const DEFAULT_QUOTE_BODY =
  "A short intro to the property, the seller’s story, or the professionals behind this listing — set in a quiet framed page so the words can lead.";

const DEFAULT_COMPANY_SLOGAN = "Your market. Your story.";
const DEFAULT_COMPANY_MISSION =
  "Company and agent details for this listing — who you are, how to reach you, and what you stand for.";

export function isAdIntroSectionPage(
  page: Pick<TalisBooksViewerPage, "systemKey">,
): boolean {
  return page.systemKey === TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY;
}

export type AdIntroSectionOptions = {
  introWriteup?: string | null;
  adLeftImageUrl?: string | null;
  adRightImageUrl?: string | null;
  agent?: AdIntroAgentDetails | null;
};

export function adIntroSectionContentPayload(
  leaf: AdIntroSectionLeaf,
  options?: AdIntroSectionOptions,
): AdIntroSectionContentPayload {
  const intro = options?.introWriteup?.trim() || DEFAULT_QUOTE_BODY;
  const agent = options?.agent;

  switch (leaf) {
    case "ad_left":
      return {
        pageRole: "property_content",
        layout: "full_bleed",
        title: "",
        body: "",
        heroImageUrl: options?.adLeftImageUrl || undefined,
        isPermanent: false,
        clientEditable: true,
        systemKey: TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY,
        brochureLeaf: "left",
        sectionLeaf: leaf,
      };
    case "ad_right":
      return {
        pageRole: "property_content",
        layout: "full_bleed",
        title: "",
        body: "",
        heroImageUrl: options?.adRightImageUrl || undefined,
        isPermanent: false,
        clientEditable: true,
        systemKey: TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY,
        brochureLeaf: "right",
        sectionLeaf: leaf,
      };
    case "company_agent_left": {
      const brokerageName = agent?.brokerageName?.trim() || "Talispros™";
      const agentName = agent?.name?.trim() || "Listing contact";
      const mission =
        agent?.brokerageLine?.trim() ||
        intro ||
        DEFAULT_COMPANY_MISSION;
      return {
        pageRole: "agent_brokerage",
        layout: "agent_intro",
        title: brokerageName,
        body: mission,
        agentName,
        agentTitle: agent?.title?.trim() || "Property owner",
        agentPhone: agent?.phone?.trim() || undefined,
        agentEmail: agent?.email?.trim() || undefined,
        agentPhotoUrl: agent?.photoUrl?.trim() || undefined,
        brokerageName,
        brokerageLine: agent?.brokerageLine?.trim() || undefined,
        brokerageLogoUrl: agent?.brokerageLogoUrl?.trim() || undefined,
        slogan: DEFAULT_COMPANY_SLOGAN,
        mission,
        isPermanent: false,
        clientEditable: true,
        systemKey: TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY,
        brochureLeaf: "left",
        sectionLeaf: leaf,
      };
    }
    case "quote_right":
      return {
        pageRole: "property_content",
        layout: "quote",
        title: DEFAULT_QUOTE_TITLE,
        body: intro,
        isPermanent: false,
        clientEditable: true,
        systemKey: TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY,
        brochureLeaf: "right",
        sectionLeaf: leaf,
      };
  }
}

function pageFromPayload(
  leaf: AdIntroSectionLeaf,
  pageNumber: number,
  content: AdIntroSectionContentPayload,
): TalisBooksViewerPage {
  return {
    id: `optional-${TALISBOOKS_AD_INTRO_SECTION_SYSTEM_KEY}-${leaf}`,
    pageNumber,
    pageRole: content.pageRole,
    layout: content.layout,
    title: content.title,
    body: content.body,
    heroImageUrl: content.heroImageUrl,
    agentName: content.agentName,
    agentTitle: content.agentTitle,
    agentPhone: content.agentPhone,
    agentEmail: content.agentEmail,
    agentPhotoUrl: content.agentPhotoUrl,
    brokerageName: content.brokerageName,
    brokerageLine: content.brokerageLine,
    brokerageLogoUrl: content.brokerageLogoUrl,
    slogan: content.slogan,
    mission: content.mission,
    isPermanent: false,
    clientEditable: true,
    systemKey: content.systemKey,
    brochureLeaf: content.brochureLeaf,
  };
}

/** Viewer pages for the optional 4-page block starting at `startPageNumber`. */
export function createAdIntroSectionPages(
  startPageNumber: number,
  options?: AdIntroSectionOptions,
): TalisBooksViewerPage[] {
  const leaves: AdIntroSectionLeaf[] = [
    "ad_left",
    "ad_right",
    "company_agent_left",
    "quote_right",
  ];

  return leaves.map((leaf, index) => {
    const content = adIntroSectionContentPayload(leaf, options);
    return pageFromPayload(leaf, startPageNumber + index, content);
  });
}

/** Self-service / DB content rows for the optional section. */
export function createAdIntroSectionPageRows(options: {
  startPageNumber: number;
  introWriteup?: string | null;
  adLeftImageUrl?: string | null;
  adRightImageUrl?: string | null;
  agent?: AdIntroAgentDetails | null;
}): Array<{
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
}> {
  const start = options.startPageNumber;
  const leaves: Array<{ leaf: AdIntroSectionLeaf; slug: string; title: string }> =
    [
      { leaf: "ad_left", slug: "optional-ad-left", title: "Advertising" },
      { leaf: "ad_right", slug: "optional-ad-right", title: "Advertising" },
      {
        leaf: "company_agent_left",
        slug: "optional-company-agent",
        title: "Company & agent",
      },
      { leaf: "quote_right", slug: "optional-intro-quote", title: "Introduction" },
    ];

  return leaves.map((entry, index) => {
    const pageNumber = start + index;
    const content = adIntroSectionContentPayload(entry.leaf, options);
    return {
      title: entry.title,
      slug: entry.slug,
      page_number: pageNumber,
      sort_order: pageNumber,
      content: { ...content },
    };
  });
}
