/**
 * Identify the Talisbook™ Parting Shot / RM22 outro leaf used for
 * viewer Open Graph cards and Mapsite™ scenic fallbacks.
 *
 * Recognition (first match wins, scanning from the back of the book):
 *   - layout/role `parting` or `outro`
 *   - title/caption/slug/body/url containing "Parting Shot" or "outro"
 *   - otherwise the last interior image immediately before the back cover
 *     (RM22 title-caption outro slot)
 */

export type PartingShotPage = {
  pageNumber?: number | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  pageRole?: string | null;
  layout?: string | null;
  systemKey?: string | null;
  spreadImageUrl?: string | null;
  heroImageUrl?: string | null;
};

const PARTING_TEXT = /parting\s*shot|\boutro\b/i;

function normalized(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || "";
}

export function ebookPageImageUrl(page: PartingShotPage): string | null {
  const spread = page.spreadImageUrl?.trim() || "";
  const hero = page.heroImageUrl?.trim() || "";
  return spread || hero || null;
}

export function isSkippedOgEbookPage(page: PartingShotPage): boolean {
  const role = normalized(page.pageRole);
  const layout = normalized(page.layout);
  const systemKey = normalized(page.systemKey);
  if (role === "cover" || layout === "cover") return true;
  if (layout === "global_content" || systemKey === "glasshouse_brochure") {
    return true;
  }
  if (layout === "agent_summary" || layout === "agent_intro") return true;
  if (layout === "custom_content" || role === "agent_brokerage") return true;
  if (layout === "maps") return true;
  return false;
}

export function isPartingShotPage(page: PartingShotPage): boolean {
  const layout = normalized(page.layout);
  const role = normalized(page.pageRole);
  if (layout === "parting" || layout === "outro") return true;
  if (role === "parting" || role === "outro") return true;
  const haystack = [
    page.slug,
    page.title,
    page.subtitle,
    page.body,
    page.spreadImageUrl,
    page.heroImageUrl,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");
  return PARTING_TEXT.test(haystack);
}

export function pickPartingShotImageUrl(
  pages: PartingShotPage[],
): string | null {
  const ordered = [...pages].sort(
    (left, right) => (left.pageNumber ?? 0) - (right.pageNumber ?? 0),
  );
  const interiors = ordered.filter((page) => !isSkippedOgEbookPage(page));

  for (const page of [...interiors].reverse()) {
    if (!isPartingShotPage(page)) continue;
    const url = ebookPageImageUrl(page);
    if (url) return url;
  }

  // RM22 outro is the last title-caption / landscape leaf before the back cover.
  for (const page of [...interiors].reverse()) {
    const url = ebookPageImageUrl(page);
    if (url) return url;
  }

  return null;
}
