import type { TalisBooksImageOrientation } from "../image-engine/types";
import {
  TALISBOOKS_LAYOUT_PLACEMENTS,
  TALISBOOKS_MEDIA_KINDS,
} from "./constants";

export type TalisBooksLayoutPlacement = (typeof TALISBOOKS_LAYOUT_PLACEMENTS)[number];

export type TalisBooksMediaKind = (typeof TALISBOOKS_MEDIA_KINDS)[number];

export type TalisBooksLayoutOrientation = TalisBooksImageOrientation;

export interface TalisBooksLayoutImageRef {
  id: string;
  url: string;
  width: number;
  height: number;
  caption?: string;
  altText?: string;
  /** Defaults to "image". floorplan / pdf are future-ready stubs. */
  mediaKind?: TalisBooksMediaKind;
  /** Optional derived roles from the image processor (centerfold halves). */
  role?: "original" | "derived_left" | "derived_right";
  parentImageId?: string | null;
}

export interface TalisBooksClassifiedAsset extends TalisBooksLayoutImageRef {
  orientation: TalisBooksLayoutOrientation;
  aspectRatio: number;
  mediaKind: TalisBooksMediaKind;
  hasCaption: boolean;
}

export interface TalisBooksPlacementSlot {
  imageId: string;
  url: string;
  fit: "cover" | "contain";
  position: "primary" | "secondary" | "gallery" | "background";
  caption?: string;
  altText?: string;
}

export interface TalisBooksGeneratedPageContent {
  pageRole: "property_content";
  placement: TalisBooksLayoutPlacement;
  orientation: TalisBooksLayoutOrientation | "mixed";
  mediaKind: TalisBooksMediaKind;
  layoutSlug: string;
  layoutType: "single" | "spread" | "grid";
  bleed: boolean;
  centered: boolean;
  slots: TalisBooksPlacementSlot[];
  caption?: string;
  blocks: Array<{
    type: "property_content" | "property_photo" | "text" | "image";
    imageId?: string;
    imageCategory?: "property";
    label?: string;
  }>;
  /** Reserved for floorplan / PDF rendering pipelines. */
  future: {
    supportsFloorplan: true;
    supportsPdf: true;
  };
  engineVersion: string;
}

export interface TalisBooksGeneratedPage {
  pageNumber: number;
  title: string;
  slug: string;
  content: TalisBooksGeneratedPageContent;
  backgroundImageId: string | null;
}

export interface TalisBooksLayoutDecision {
  placement: TalisBooksLayoutPlacement;
  assets: TalisBooksClassifiedAsset[];
  reason: string;
}

export interface TalisBooksLayoutEngineResult {
  decisions: TalisBooksLayoutDecision[];
  pages: TalisBooksGeneratedPage[];
  skipped: Array<{ imageId: string; reason: string }>;
  stats: {
    totalInputs: number;
    pagesGenerated: number;
    byOrientation: Record<TalisBooksLayoutOrientation, number>;
    byPlacement: Record<TalisBooksLayoutPlacement, number>;
  };
}

export interface GenerateBookPagesOptions {
  /** First property page number (default 4 per official page rules). */
  startPageNumber?: number;
  /** Max property pages to generate (default leaves room for cover + closing). */
  maxPropertyPages?: number;
}
