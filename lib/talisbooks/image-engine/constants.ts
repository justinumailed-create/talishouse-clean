export const TALISBOOKS_IMAGE_STORAGE_BUCKET = "talisbooks-assets";

export const TALISBOOKS_CENTERFOLD_LAYOUT_SLUG_PREFIX = "centerfold";

export const TALISBOOKS_DERIVED_IMAGE_MIME_TYPE = "image/jpeg";

export const TALISBOOKS_DERIVED_IMAGE_QUALITY = 92;

/**
 * Storage paths carry a UUID or timestamp, so an uploaded asset never changes.
 * Without this Supabase answers `cache-control: no-cache` and the viewer
 * refetches every page image on each turn.
 */
export const TALISBOOKS_ASSET_CACHE_CONTROL = "31536000";

/** Widest a property photo is stored after upload optimization. */
export const TALISBOOKS_PAGE_IMAGE_MAX_EDGE_PX = 2048;

/** Default re-encode quality for page art (adaptive optimizer may vary 78–88). */
export const TALISBOOKS_PAGE_IMAGE_QUALITY = 86;

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
