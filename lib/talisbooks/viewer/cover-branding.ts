import type { TalisBooksViewerPage } from "./types";

type BrandingFields = Pick<
  TalisBooksViewerPage,
  | "agentName"
  | "agentTitle"
  | "agentPhone"
  | "agentEmail"
  | "agentPhotoUrl"
  | "brokerageName"
  | "brokerageLine"
  | "brokerageLogoUrl"
  | "slogan"
>;

function pickBranding(page: TalisBooksViewerPage): BrandingFields {
  return {
    agentName: page.agentName,
    agentTitle: page.agentTitle,
    agentPhone: page.agentPhone,
    agentEmail: page.agentEmail,
    agentPhotoUrl: page.agentPhotoUrl,
    brokerageName: page.brokerageName,
    brokerageLine: page.brokerageLine,
    brokerageLogoUrl: page.brokerageLogoUrl,
    slogan: page.slogan,
  };
}

function hasBranding(page: TalisBooksViewerPage): boolean {
  return Boolean(
    page.brokerageName?.trim() ||
      page.brokerageLogoUrl?.trim() ||
      page.agentName?.trim() ||
      page.agentPhotoUrl?.trim(),
  );
}

/**
 * Copy agent/agency fields from the agent summary page onto front covers
 * that were generated before branding lived on page 1.
 */
export function enrichCoverPagesWithAgentBranding(
  pages: TalisBooksViewerPage[],
): TalisBooksViewerPage[] {
  const source = pages.find(
    (page) =>
      page.pageRole === "agent_brokerage" &&
      (page.layout === "agent_summary" || hasBranding(page)),
  );
  if (!source || !hasBranding(source)) {
    return pages;
  }

  const branding = pickBranding(source);
  return pages.map((page) => {
    const isFrontCover =
      page.pageRole === "cover" &&
      page.layout === "cover" &&
      page.pageNumber === 1;
    if (!isFrontCover || hasBranding(page)) {
      return page;
    }
    return { ...page, ...branding };
  });
}
