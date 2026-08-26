import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  ensurePermanentClosingPages,
  getGlasshouseBrochureSource,
  hydratePermanentViewerPages,
} from "@/lib/talisbooks/permanent-pages";
import { createDemoViewerBook } from "./demo-book";
import { enrichCoverPagesWithAgentBranding, normalizeMapSiteBackCoverToArt, stripTrailingBlankFacingPages } from "./cover-branding";
import type {
  TalisBooksViewerBook,
  TalisBooksViewerPage,
  TalisBooksViewerPageLayout,
} from "./types";
import type { TalisBooksPageRole } from "../types";
import type { TalisBooksCoverTemplateId } from "../covers";

function asLayout(value: unknown): TalisBooksViewerPageLayout | undefined {
  if (
    value === "cover" ||
    value === "agent_intro" ||
    value === "agent_summary" ||
    value === "caption" ||
    value === "full_bleed" ||
    value === "centerfold_left" ||
    value === "centerfold_right" ||
    value === "parting" ||
    value === "maps" ||
    value === "quote" ||
    value === "facing" ||
    value === "custom_content" ||
    value === "global_content"
  ) {
    return value;
  }
  return undefined;
}

function asPageRole(value: unknown): TalisBooksPageRole {
  if (
    value === "cover" ||
    value === "agent_brokerage" ||
    value === "property_content"
  ) {
    return value;
  }
  return "property_content";
}

function asCoverTemplateId(value: unknown): TalisBooksCoverTemplateId | undefined {
  if (
    value === "aurora-frame" ||
    value === "horizon-caption" ||
    value === "masthead-rise" ||
    value === "cascade-editorial" ||
    value === "vista-overlay"
  ) {
    return value;
  }
  return undefined;
}

function buildFallbackPages(input: {
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
}): TalisBooksViewerPage[] {
  return ensurePermanentClosingPages([
    {
      id: "cover",
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: input.title,
      subtitle: input.subtitle,
      heroImageUrl: input.coverImageUrl || undefined,
    },
    {
      id: "about",
      pageNumber: 2,
      pageRole: "property_content",
      layout: "caption",
      title: input.subtitle || input.title,
      body: input.description,
      heroImageUrl: input.coverImageUrl || undefined,
    },
    {
      id: "details",
      pageNumber: 3,
      pageRole: "property_content",
      layout: "caption",
      title: "Property story",
      body: input.description,
    },
    {
      id: "back-cover",
      pageNumber: 4,
      pageRole: "cover",
      layout: "cover",
      title: input.title,
      subtitle: input.subtitle,
      body: input.description,
      heroImageUrl: input.coverImageUrl || undefined,
    },
  ]);
}

/**
 * Load a published Talisbooks™ viewer book by slug.
 * Falls back to null when not found (caller may use demo for known demo slugs).
 */
export async function getViewerBookBySlug(
  slugRaw: string
): Promise<TalisBooksViewerBook | null> {
  const slug = slugRaw.trim();
  if (!slug || !isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data: book, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !book) return null;

  const metadata = (book.metadata as Record<string, unknown>) ?? {};
  const coverImageUrl =
    typeof metadata.coverImageUrl === "string" ? metadata.coverImageUrl : null;
  const galleryImageUrls = Array.isArray(metadata.galleryImageUrls)
    ? metadata.galleryImageUrls.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0,
      )
    : [];
  const backCoverImageUrl =
    (typeof metadata.backCoverImageUrl === "string"
      ? metadata.backCoverImageUrl
      : null) ||
    galleryImageUrls[1] ||
    null;
  const coverSpreadOpening = metadata.coverSpreadOpening === true;

  const { data: pages } = await supabase
    .from("talisbooks_book_pages")
    .select("*")
    .eq("book_id", book.id)
    .eq("is_visible", true)
    .order("page_number", { ascending: true });

  const glasshouse = getGlasshouseBrochureSource();
  const viewerPages: TalisBooksViewerPage[] =
    (pages ?? []).length > 0
      ? (pages ?? []).map((page) => {
          const content = (page.content as Record<string, unknown>) ?? {};
          const layout = asLayout(content.layout) ?? "caption";
          const storedHero =
            typeof content.heroImageUrl === "string"
              ? content.heroImageUrl
              : undefined;
          const isGlasshouse =
            content.systemKey === "glasshouse_brochure" ||
            layout === "global_content";
          const skipCoverFallback =
            layout === "facing" ||
            layout === "centerfold_left" ||
            layout === "centerfold_right" ||
            layout === "global_content";
          const heroFallback =
            layout === "agent_summary"
              ? backCoverImageUrl || coverImageUrl || undefined
              : skipCoverFallback
                ? undefined
                : coverImageUrl || undefined;
          return {
            id: page.id,
            pageNumber: page.page_number,
            pageRole: asPageRole(content.pageRole),
            title:
              (typeof content.title === "string" && content.title) ||
              page.title ||
              book.title,
            subtitle:
              typeof content.subtitle === "string" ? content.subtitle : undefined,
            body: typeof content.body === "string" ? content.body : undefined,
            heroImageUrl: isGlasshouse
              ? glasshouse.spreadImageUrl
              : storedHero || heroFallback,
            spreadImageUrl: isGlasshouse
              ? glasshouse.spreadImageUrl
              : typeof content.spreadImageUrl === "string"
                ? content.spreadImageUrl
                : undefined,
            layout,
            coverTemplateId: asCoverTemplateId(content.coverTemplateId),
            latitude:
              typeof content.latitude === "number" ? content.latitude : undefined,
            longitude:
              typeof content.longitude === "number" ? content.longitude : undefined,
            mapZoom:
              typeof content.mapZoom === "number" ? content.mapZoom : undefined,
            agentName:
              typeof content.agentName === "string" ? content.agentName : undefined,
            agentTitle:
              typeof content.agentTitle === "string" ? content.agentTitle : undefined,
            agentPhone:
              typeof content.agentPhone === "string" ? content.agentPhone : undefined,
            agentEmail:
              typeof content.agentEmail === "string" ? content.agentEmail : undefined,
            agentPhotoUrl:
              typeof content.agentPhotoUrl === "string"
                ? content.agentPhotoUrl
                : undefined,
            brokerageName:
              typeof content.brokerageName === "string"
                ? content.brokerageName
                : undefined,
            brokerageLine:
              typeof content.brokerageLine === "string"
                ? content.brokerageLine
                : undefined,
            brokerageLogoUrl:
              typeof content.brokerageLogoUrl === "string"
                ? content.brokerageLogoUrl
                : undefined,
            slogan: typeof content.slogan === "string" ? content.slogan : undefined,
            mission:
              typeof content.mission === "string" ? content.mission : undefined,
            address:
              typeof content.address === "string" ? content.address : undefined,
            exactPdfPage: content.exactPdfPage === true,
            isPermanent: content.isPermanent === true,
            clientEditable: !(
              content.clientEditable === false ||
              content.isPermanent === true ||
              content.systemKey === "glasshouse_brochure" ||
              content.exactPdfPage === true
            ),
            systemKey:
              typeof content.systemKey === "string" ? content.systemKey : undefined,
            brochureLeaf:
              content.brochureLeaf === "left" || content.brochureLeaf === "right"
                ? content.brochureLeaf
                : undefined,
            advertisement: content.advertisement === true,
            advertisementLabel:
              typeof content.advertisementLabel === "string"
                ? content.advertisementLabel
                : undefined,
            captionsEnabled: content.captionsEnabled === true,
            captionSkipped: content.captionSkipped === true,
            captionAlign:
              content.captionAlign === "left" || content.captionAlign === "right"
                ? content.captionAlign
                : undefined,
            spreadMat: content.spreadMat === true,
            pricingLine:
              typeof content.pricingLine === "string"
                ? content.pricingLine
                : undefined,
            disclaimer:
              typeof content.disclaimer === "string"
                ? content.disclaimer
                : undefined,
          };
        })
      : buildFallbackPages({
          title: book.title,
          subtitle: book.subtitle,
          description: book.description,
          coverImageUrl,
        });

  const skipPermanentPages =
    metadata.exactPdfPages === true || metadata.skipPermanentPages === true;
  const isMapSiteBook =
    typeof book.fast_code === "string" && book.fast_code.trim().length > 0;
  const artBackCoverUrl = backCoverImageUrl || coverImageUrl || null;

  const withPermanentPages = skipPermanentPages
    ? viewerPages
    : ensurePermanentClosingPages(hydratePermanentViewerPages(viewerPages));

  const withMapSiteBack = isMapSiteBook
    ? stripTrailingBlankFacingPages(
        normalizeMapSiteBackCoverToArt(withPermanentPages, artBackCoverUrl),
      )
    : withPermanentPages;

  return {
    id: book.id,
    slug: book.slug,
    fastCode: typeof book.fast_code === "string" ? book.fast_code : undefined,
    accountType:
      typeof book.account_type === "string" ? book.account_type : undefined,
    title: book.title,
    subtitle: book.subtitle,
    frontCoverImageUrl: coverImageUrl || undefined,
    backCoverImageUrl: artBackCoverUrl || undefined,
    coverSpreadOpening,
    pages: enrichCoverPagesWithAgentBranding(withMapSiteBack),
  };
}

export async function resolveViewerBookBySlug(
  slug: string
): Promise<TalisBooksViewerBook | null> {
  const fromDb = await getViewerBookBySlug(slug);
  if (fromDb) return fromDb;

  const { PINNED_TALISBOOK_SLUG, createPinnedTalisBookViewer } = await import(
    "@/lib/talisbooks/library/pinned-catalog"
  );
  if (slug.trim() === PINNED_TALISBOOK_SLUG) {
    return createPinnedTalisBookViewer();
  }

  const demoSlugs = new Set(["sample-ebook", "demo", "preview"]);
  if (demoSlugs.has(slug)) {
    const demo = createDemoViewerBook();
    return { ...demo, slug };
  }

  return null;
}
