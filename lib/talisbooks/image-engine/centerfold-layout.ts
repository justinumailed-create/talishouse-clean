import { TALISBOOKS_CENTERFOLD_LAYOUT_SLUG_PREFIX } from "./constants";
import type { TalisBooksCenterfoldLayout } from "./types";

export interface BuildCenterfoldLayoutInput {
  sourceName: string;
  sourceWidth: number;
  sourceHeight: number;
  leftWidth: number;
  rightWidth: number;
  layoutId?: string;
  sourceOrientation?: "landscape" | "panorama";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildCenterfoldLayoutSlug(sourceName: string, layoutId?: string): string {
  const base = slugify(sourceName) || "image";
  const suffix = layoutId ? layoutId.slice(0, 8) : Date.now().toString(36);
  return `${TALISBOOKS_CENTERFOLD_LAYOUT_SLUG_PREFIX}-${base}-${suffix}`;
}

export function buildCenterfoldLayout(
  input: BuildCenterfoldLayoutInput,
): TalisBooksCenterfoldLayout {
  const slug = buildCenterfoldLayoutSlug(input.sourceName, input.layoutId);

  return {
    slug,
    name: `Centerfold — ${input.sourceName}`,
    description:
      "Auto-generated facing spread from a landscape upload. Left and right halves map to book pages. Original is preserved.",
    layoutType: "spread",
    gridConfig: {
      columns: 2,
      gutter: 0,
      spread: true,
      centerfold: true,
    },
    cssClasses: "talisbooks-layout-centerfold talisbooks-layout-spread",
    config: {
      centerfold: true,
      sourceOrientation: input.sourceOrientation ?? "landscape",
      pages: [
        { side: "left", imageRole: "derived_left", fit: "cover", bleed: true },
        { side: "right", imageRole: "derived_right", fit: "cover", bleed: true },
      ],
      /** Prefer continuous original crop in the viewer when original URL is available. */
      continuousSpread: true,
      captionSide: "right" as const,
      sourceWidth: input.sourceWidth,
      sourceHeight: input.sourceHeight,
      leftWidth: input.leftWidth,
      rightWidth: input.rightWidth,
    },
  };
}
