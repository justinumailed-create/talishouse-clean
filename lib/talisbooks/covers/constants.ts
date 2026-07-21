export const TALISBOOKS_COVER_TEMPLATE_IDS = [
  "aurora-frame",
  "horizon-caption",
  "masthead-rise",
  "cascade-editorial",
  "vista-overlay",
] as const;

export type TalisBooksCoverTemplateId = (typeof TALISBOOKS_COVER_TEMPLATE_IDS)[number];

export const TALISBOOKS_COVER_MARGIN_RATIO = 0.08;

/** Default aspect used by cover previews (portrait book). */
export const TALISBOOKS_COVER_ASPECT_RATIO = "3 / 4";
