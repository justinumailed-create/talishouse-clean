import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  getMapSiteEbookContext,
  loadEbookPageMedia,
} from "@/lib/talisbooks/mapsite-ebook-service";
import type { PartingShotPage } from "@/lib/talisbooks/parting-shot";
import { resolveViewerBookBySlug } from "@/lib/talisbooks/viewer/load-book";
import type { TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";
import {
  selectMapsiteScenicBackgroundUrl,
  selectViewerPartingShotUrl,
} from "@/lib/talispros/mapsite-og-image";

export function viewerPageToPartingShot(
  page: TalisBooksViewerPage,
): PartingShotPage {
  return {
    pageNumber: page.pageNumber,
    title: page.title,
    subtitle: page.subtitle,
    body: page.body,
    pageRole: page.pageRole,
    layout: page.layout,
    systemKey: page.systemKey,
    slug: page.templateRole,
    spreadImageUrl: page.spreadImageUrl,
    heroImageUrl: page.heroImageUrl,
  };
}

/** Parting shot, then a real listing photo. Never the front cover or a logo poster. */
export async function loadMapsiteScenicBackgroundUrl(
  fastCode: string,
): Promise<string | null> {
  const code = fastCode.trim();
  if (!code) return null;

  try {
    const context = await getMapSiteEbookContext(code);
    const pages = context?.primaryEbook?.id
      ? await loadEbookPageMedia(context.primaryEbook.id)
      : [];

    let fallbackImageUrls: Array<string | null | undefined> = [];
    try {
      const mapsite = await getMapSiteByFastCode(code);
      fallbackImageUrls = [
        mapsite?.headerImageUrl,
        mapsite?.ogImageUrl,
        ...(mapsite?.galleryImages ?? []),
      ];
    } catch (error) {
      console.warn(
        "[og] listing photo lookup failed:",
        error instanceof Error ? error.message : error,
      );
    }

    return selectMapsiteScenicBackgroundUrl({ pages, fallbackImageUrls });
  } catch (error) {
    console.warn(
      "[og] scenic background lookup failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function loadViewerPartingShotUrl(
  slug: string,
): Promise<string | null> {
  const normalized = slug.trim();
  if (!normalized) return null;
  try {
    const book = await resolveViewerBookBySlug(normalized);
    if (!book) return null;
    return selectViewerPartingShotUrl(book.pages.map(viewerPageToPartingShot));
  } catch (error) {
    console.warn(
      "[og] viewer parting shot lookup failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
