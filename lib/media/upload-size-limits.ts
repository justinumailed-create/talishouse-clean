export type OptimizeImageKind = "property" | "agent" | "logo";

/**
 * Shared upload size + dimension budgets for Talisbook™ images.
 *
 * Vercel Functions reject request bodies above ~4.5 MB with HTTP 413
 * (`FUNCTION_PAYLOAD_TOO_LARGE`). That cap is infrastructure-level and is
 * not raised by `serverActions.bodySizeLimit` or `proxyClientMaxBodySize`.
 * Phone JPEGs routinely exceed it, so the browser must shrink the file
 * before POST `/api/talispros/ebook-generate/upload-image`.
 */

/** Vercel Function request/response body limit (4.5 MB). */
export const VERCEL_FUNCTION_BODY_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);

/**
 * Max bytes for the file part of the optimize-upload FormData.
 * Leaves headroom under 4.5 MB for multipart boundaries and fields.
 */
export const CLIENT_UPLOAD_MAX_BYTES = 3_500_000;

/**
 * First-pass client re-encode is skipped when the original is already
 * this small. Server-side Sharp still optimizes for storage.
 */
export const CLIENT_UPLOAD_SKIP_BYTES = 1_500_000;

/** Property / PDF page art — fullscreen + ebook quality. */
export const PROPERTY_IMAGE_MAX_EDGE_PX = 2048;
/** Agent headshot — cropped square, then capped. */
export const AGENT_PHOTO_MAX_EDGE_PX = 1200;
/** Logo long edge after background strip. */
export const LOGO_MAX_EDGE_PX = 1200;

/** Server storage target after Sharp optimize. */
export const PROPERTY_TARGET_MAX_BYTES = 1_500_000;
