import { TALISBOOKS_LAYOUT_ENGINE_VERSION } from "./constants";
import type {
  TalisBooksClassifiedAsset,
  TalisBooksGeneratedPage,
  TalisBooksGeneratedPageContent,
  TalisBooksLayoutDecision,
  TalisBooksLayoutOrientation,
  TalisBooksPlacementSlot,
} from "./types";

function layoutSlugFor(placement: string, pageNumber: number): string {
  return `auto-${placement}-p${pageNumber}`;
}

function titleFor(placement: string, pageNumber: number): string {
  const labels: Record<string, string> = {
    single: "Property Image",
    double: "Property Pair",
    full_bleed: "Property View",
    centered: "Featured Image",
    caption: "Property Detail",
    gallery: "Gallery",
    centerfold: "Centerfold",
  };
  return `${labels[placement] ?? "Property"} · Page ${pageNumber}`;
}

function orientationForDecision(
  assets: TalisBooksClassifiedAsset[],
): TalisBooksLayoutOrientation | "mixed" {
  const unique = new Set(assets.map((asset) => asset.orientation));
  if (unique.size === 1) {
    return assets[0]!.orientation;
  }
  return "mixed";
}

function slotsForDecision(decision: TalisBooksLayoutDecision): TalisBooksPlacementSlot[] {
  const { placement, assets } = decision;

  if (placement === "gallery") {
    return assets.map((asset) => ({
      imageId: asset.id,
      url: asset.url,
      fit: "cover" as const,
      position: "gallery" as const,
      caption: asset.caption,
      altText: asset.altText,
    }));
  }

  if (placement === "double" || placement === "centerfold") {
    return assets.map((asset, index) => ({
      imageId: asset.id,
      url: asset.url,
      fit: "cover" as const,
      position: (index === 0 ? "primary" : "secondary") as "primary" | "secondary",
      // Caption lives on the right half of a centerfold only.
      caption: placement === "centerfold" && index === 0 ? undefined : asset.caption,
      altText: asset.altText,
    }));
  }

  const primary = assets[0]!;
  const fit =
    placement === "centered" || placement === "caption" || primary.mediaKind === "floorplan"
      ? ("contain" as const)
      : ("cover" as const);

  return [
    {
      imageId: primary.id,
      url: primary.url,
      fit,
      position: placement === "full_bleed" ? "background" : "primary",
      caption: primary.caption,
      altText: primary.altText,
    },
  ];
}

function blocksForDecision(decision: TalisBooksLayoutDecision): TalisBooksGeneratedPageContent["blocks"] {
  const blocks: TalisBooksGeneratedPageContent["blocks"] = [
    { type: "property_content", label: decision.placement },
  ];

  for (const asset of decision.assets) {
    blocks.push({
      type: "property_photo",
      imageId: asset.id,
      imageCategory: "property",
      label: asset.altText ?? asset.caption,
    });
  }

  if (decision.placement === "caption" && decision.assets[0]?.caption) {
    blocks.push({
      type: "text",
      label: decision.assets[0].caption,
    });
  }

  return blocks;
}

/**
 * Turns a placement decision into a property content page.
 * Page numbers are assigned by the book assembler.
 */
export function generatePageFromDecision(
  decision: TalisBooksLayoutDecision,
  pageNumber: number,
): TalisBooksGeneratedPage {
  const primary = decision.assets[0]!;
  const bleed = decision.placement === "full_bleed" || decision.placement === "centerfold";
  const centered = decision.placement === "centered" || decision.placement === "caption";
  const layoutType =
    decision.placement === "gallery"
      ? "grid"
      : decision.placement === "double" || decision.placement === "centerfold"
        ? "spread"
        : "single";

  const content: TalisBooksGeneratedPageContent = {
    pageRole: "property_content",
    placement: decision.placement,
    orientation: orientationForDecision(decision.assets),
    mediaKind: primary.mediaKind,
    layoutSlug: layoutSlugFor(decision.placement, pageNumber),
    layoutType,
    bleed,
    centered,
    slots: slotsForDecision(decision),
    caption:
      decision.placement === "caption"
        ? primary.caption
        : decision.placement === "centerfold"
          ? decision.assets[1]?.caption
          : undefined,
    blocks: blocksForDecision(decision),
    future: {
      supportsFloorplan: true,
      supportsPdf: true,
    },
    engineVersion: TALISBOOKS_LAYOUT_ENGINE_VERSION,
  };

  return {
    pageNumber,
    title: titleFor(decision.placement, pageNumber),
    slug: `page-${pageNumber}-${decision.placement}`,
    content,
    backgroundImageId: bleed ? primary.id : null,
  };
}

function generateCenterfoldPages(
  decision: TalisBooksLayoutDecision,
  startPageNumber: number,
): TalisBooksGeneratedPage[] {
  const left = decision.assets[0]!;
  const right = decision.assets[1]!;
  const caption = right.caption?.trim() || undefined;

  const leftPage = generatePageFromDecision(
    {
      placement: "centerfold",
      assets: [left],
      reason: decision.reason,
    },
    startPageNumber,
  );
  leftPage.slug = `page-${startPageNumber}-centerfold-left`;
  leftPage.title = titleFor("centerfold", startPageNumber);
  leftPage.content.layoutSlug = layoutSlugFor("centerfold-left", startPageNumber);
  leftPage.content.slots = [
    {
      imageId: left.id,
      url: left.url,
      fit: "cover",
      position: "primary",
      altText: left.altText,
    },
  ];
  leftPage.content.caption = undefined;
  leftPage.content.blocks = [
    { type: "property_content", label: "centerfold_left" },
    {
      type: "property_photo",
      imageId: left.id,
      imageCategory: "property",
      label: left.altText,
    },
  ];
  leftPage.backgroundImageId = left.id;

  const rightPage = generatePageFromDecision(
    {
      placement: "centerfold",
      assets: [right],
      reason: decision.reason,
    },
    startPageNumber + 1,
  );
  rightPage.slug = `page-${startPageNumber + 1}-centerfold-right`;
  rightPage.title = caption ? caption.slice(0, 48) : titleFor("centerfold", startPageNumber + 1);
  rightPage.content.layoutSlug = layoutSlugFor("centerfold-right", startPageNumber + 1);
  rightPage.content.slots = [
    {
      imageId: right.id,
      url: right.url,
      fit: "cover",
      position: "secondary",
      caption,
      altText: right.altText,
    },
  ];
  rightPage.content.caption = caption;
  rightPage.content.blocks = [
    { type: "property_content", label: "centerfold_right" },
    {
      type: "property_photo",
      imageId: right.id,
      imageCategory: "property",
      label: right.altText ?? caption,
    },
    ...(caption ? [{ type: "text" as const, label: caption }] : []),
  ];
  rightPage.backgroundImageId = right.id;

  return [leftPage, rightPage];
}

export function generatePagesFromDecisions(
  decisions: TalisBooksLayoutDecision[],
  startPageNumber: number,
): TalisBooksGeneratedPage[] {
  const pages: TalisBooksGeneratedPage[] = [];
  let pageNumber = startPageNumber;

  for (const decision of decisions) {
    if (decision.placement === "centerfold" && decision.assets.length >= 2) {
      pages.push(...generateCenterfoldPages(decision, pageNumber));
      pageNumber += 2;
      continue;
    }

    pages.push(generatePageFromDecision(decision, pageNumber));
    pageNumber += 1;
  }

  return pages;
}

export function pagesNeededForDecision(decision: TalisBooksLayoutDecision): number {
  return decision.placement === "centerfold" && decision.assets.length >= 2 ? 2 : 1;
}
