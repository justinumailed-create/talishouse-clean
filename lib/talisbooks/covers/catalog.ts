import {
  TALISBOOKS_COVER_MARGIN_RATIO,
  TALISBOOKS_COVER_TEMPLATE_IDS,
  type TalisBooksCoverTemplateId,
} from "./constants";
import type { TalisBooksCoverTemplateDefinition } from "./types";

const sharedMargins = {
  top: TALISBOOKS_COVER_MARGIN_RATIO,
  bottom: TALISBOOKS_COVER_MARGIN_RATIO,
  unit: "ratio" as const,
};

const sharedConfig = {
  hero: { fit: "cover" as const, role: "hero" as const },
  regions: {
    topMargin: "white" as const,
    bottomMargin: "white" as const,
    hero: "image" as const,
  },
  fields: ["title", "subtitle", "heroImage"] as ["title", "subtitle", "heroImage"],
};

export const TALISBOOKS_COVER_TEMPLATES: Record<
  TalisBooksCoverTemplateId,
  TalisBooksCoverTemplateDefinition
> = {
  "aurora-frame": {
    id: "aurora-frame",
    slug: "cover-aurora-frame",
    name: "Aurora Frame",
    description:
      "Centered title and subtitle over a full hero, framed by white top and bottom margins.",
    templateType: "cover",
    layoutType: "cover",
    titlePlacement: "hero-center",
    titleAlign: "center",
    subtitleAlign: "center",
    margins: sharedMargins,
    typography: {
      titleWeight: 600,
      titleTracking: "-0.03em",
      titleCase: "none",
      subtitleWeight: 400,
      subtitleTracking: "0.08em",
    },
    cssClasses: "talisbooks-cover talisbooks-cover--aurora-frame",
    previewGradient: "linear-gradient(145deg, #1c1917 0%, #44403c 45%, #78716c 100%)",
    config: sharedConfig,
  },
  "horizon-caption": {
    id: "horizon-caption",
    slug: "cover-horizon-caption",
    name: "Horizon Caption",
    description:
      "Hero dominates the middle band; title and subtitle sit in the white bottom margin.",
    templateType: "cover",
    layoutType: "cover",
    titlePlacement: "bottom-band",
    titleAlign: "left",
    subtitleAlign: "left",
    margins: sharedMargins,
    typography: {
      titleWeight: 700,
      titleTracking: "-0.04em",
      titleCase: "none",
      subtitleWeight: 400,
      subtitleTracking: "0.02em",
    },
    cssClasses: "talisbooks-cover talisbooks-cover--horizon-caption",
    previewGradient: "linear-gradient(160deg, #0c4a6e 0%, #0369a1 50%, #7dd3fc 100%)",
    config: sharedConfig,
  },
  "masthead-rise": {
    id: "masthead-rise",
    slug: "cover-masthead-rise",
    name: "Masthead Rise",
    description:
      "Modern masthead in the white top margin; hero fills the middle with a quiet bottom band.",
    templateType: "cover",
    layoutType: "cover",
    titlePlacement: "top-band",
    titleAlign: "left",
    subtitleAlign: "left",
    margins: sharedMargins,
    typography: {
      titleWeight: 700,
      titleTracking: "-0.05em",
      titleCase: "none",
      subtitleWeight: 300,
      subtitleTracking: "0.14em",
    },
    cssClasses: "talisbooks-cover talisbooks-cover--masthead-rise",
    previewGradient: "linear-gradient(180deg, #171717 0%, #3f3f46 55%, #a1a1aa 100%)",
    config: sharedConfig,
  },
  "cascade-editorial": {
    id: "cascade-editorial",
    slug: "cover-cascade-editorial",
    name: "Cascade Editorial",
    description:
      "Asymmetric editorial: title in the top white margin, subtitle in the bottom white margin.",
    templateType: "cover",
    layoutType: "cover",
    titlePlacement: "top-left-bottom-right",
    titleAlign: "left",
    subtitleAlign: "right",
    margins: sharedMargins,
    typography: {
      titleWeight: 600,
      titleTracking: "-0.035em",
      titleCase: "none",
      subtitleWeight: 400,
      subtitleTracking: "0.12em",
    },
    cssClasses: "talisbooks-cover talisbooks-cover--cascade-editorial",
    previewGradient: "linear-gradient(125deg, #14532d 0%, #166534 40%, #86efac 100%)",
    config: sharedConfig,
  },
  "vista-overlay": {
    id: "vista-overlay",
    slug: "cover-vista-overlay",
    name: "Vista Overlay",
    description:
      "Lower-left title stack on the hero with white framing margins for a premium lookbook feel.",
    templateType: "cover",
    layoutType: "cover",
    titlePlacement: "hero-lower-left",
    titleAlign: "left",
    subtitleAlign: "left",
    margins: sharedMargins,
    typography: {
      titleWeight: 600,
      titleTracking: "-0.04em",
      titleCase: "none",
      subtitleWeight: 400,
      subtitleTracking: "0.06em",
    },
    cssClasses: "talisbooks-cover talisbooks-cover--vista-overlay",
    previewGradient: "linear-gradient(155deg, #431407 0%, #9a3412 48%, #fdba74 100%)",
    config: sharedConfig,
  },
};

export const TALISBOOKS_COVER_TEMPLATE_LIST: TalisBooksCoverTemplateDefinition[] =
  TALISBOOKS_COVER_TEMPLATE_IDS.map((id) => TALISBOOKS_COVER_TEMPLATES[id]);
