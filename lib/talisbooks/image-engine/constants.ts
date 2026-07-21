export const TALISBOOKS_IMAGE_STORAGE_BUCKET = "talisbooks-assets";

export const TALISBOOKS_CENTERFOLD_LAYOUT_SLUG_PREFIX = "centerfold";

export const TALISBOOKS_DERIVED_IMAGE_MIME_TYPE = "image/jpeg";

export const TALISBOOKS_DERIVED_IMAGE_QUALITY = 92;

/**
 * Preferred single-page landscape aspect (width / height).
 * Real-estate uploads wider than this become an automatic centerfold
 * (left page + right page) instead of a single-page crop.
 */
export const TALISBOOKS_PREFERRED_PAGE_ASPECT_RATIO = 4 / 3;

/** Review states for admin centerfold preview before publishing. */
export const TALISBOOKS_CENTERFOLD_REVIEW_STATUSES = [
  "pending_preview",
  "approved",
  "rejected",
] as const;
