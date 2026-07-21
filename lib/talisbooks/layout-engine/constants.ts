/** Official placements the engine may assign — users do not choose these. */
export const TALISBOOKS_LAYOUT_PLACEMENTS = [
  "single",
  "double",
  "full_bleed",
  "centered",
  "caption",
  "gallery",
  "centerfold",
] as const;

/** Future media kinds reserved for floorplans and PDFs. */
export const TALISBOOKS_MEDIA_KINDS = ["image", "floorplan", "pdf"] as const;

/** Max images packed into a gallery page before spilling to the next. */
export const TALISBOOKS_GALLERY_MAX_IMAGES = 4;

/** Max images on a double placement page. */
export const TALISBOOKS_DOUBLE_IMAGE_COUNT = 2;

export const TALISBOOKS_LAYOUT_ENGINE_VERSION = "1.0.0";
