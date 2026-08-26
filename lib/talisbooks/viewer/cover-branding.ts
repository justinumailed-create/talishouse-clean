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
    // Art-only covers (pinned / self-service wrap) stay chrome-free.
    if (!isFrontCover || hasBranding(page) || page.exactPdfPage === true) {
      return page;
    }
    return { ...page, ...branding };
  });
}

/**
 * MapSite / self-service books used to close on an agent_summary leaf.
 * Match the pinned TalisBook™: last leaf is full-bleed wrap art only.
 */
export function normalizeMapSiteBackCoverToArt(
  pages: TalisBooksViewerPage[],
  backCoverImageUrl?: string | null,
): TalisBooksViewerPage[] {
  if (pages.length === 0) return pages;

  const lastIndex = pages.length - 1;
  const last = pages[lastIndex]!;
  // Legacy self-service closed on agent_summary; new books already use art covers.
  if (last.layout !== "agent_summary") {
    return pages;
  }

  const artUrl =
    backCoverImageUrl?.trim() || last.heroImageUrl?.trim() || undefined;

  const next = pages.slice();
  next[lastIndex] = {
    ...last,
    pageRole: "cover",
    layout: "cover",
    title: "",
    subtitle: undefined,
    body: "",
    heroImageUrl: artUrl,
    exactPdfPage: true,
    coverSpreadHalf: "back",
    agentName: undefined,
    agentTitle: undefined,
    agentPhone: undefined,
    agentEmail: undefined,
    agentPhotoUrl: undefined,
    brokerageName: undefined,
    brokerageLine: undefined,
    brokerageLogoUrl: undefined,
    slogan: undefined,
    mission: undefined,
    address: undefined,
  };
  return next;
}

function isBlankFacingPage(page: TalisBooksViewerPage): boolean {
  return (
    page.layout === "facing" &&
    !page.heroImageUrl?.trim() &&
    !page.spreadImageUrl?.trim()
  );
}

function isClosingCoverPage(page: TalisBooksViewerPage): boolean {
  return (
    page.pageRole === "cover" ||
    page.layout === "cover" ||
    page.layout === "agent_summary"
  );
}

/**
 * Drop legacy blank endpaper / empty facing leaves immediately before the
 * back cover so MapSite self-serve books match the pinned sample.
 * Keeps an even page count so the back cover stays alone on its spread.
 */
export function stripTrailingBlankFacingPages(
  pages: TalisBooksViewerPage[],
): TalisBooksViewerPage[] {
  if (pages.length < 3) return pages;

  const lastIndex = pages.length - 1;
  const last = pages[lastIndex]!;
  if (!isClosingCoverPage(last)) return pages;

  let cut = lastIndex;
  while (cut > 1 && isBlankFacingPage(pages[cut - 1]!)) {
    cut -= 1;
  }
  if (cut === lastIndex) return pages;

  const body = pages.slice(0, cut);
  // Issuu pairing: even totals place the back cover alone on the final spread.
  if ((body.length + 1) % 2 === 1 && cut < lastIndex) {
    body.push(pages[cut]!);
  }

  return [...body, last].map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
}
