import { SELF_SERVICE_MAX_UPLOAD_IMAGES } from "@/lib/talisbooks/self-service-page-plan";

/** Shared copy for the self-service ebook generate page (SSR + client). */
export const EBOOK_GENERATE_HELP_TEXT =
  "Add high-resolution photos or a PDF. Images are optimized automatically — no resizing needed. Image #1 (or PDF page 1) is always the cover spread: left half = back cover, right half = front cover. Remaining landscape photos become full facing spreads; portraits stay single pages.";

export const EBOOK_GENERATE_UPLOAD_HINT = `JPG, PNG, or PDF. Up to ${SELF_SERVICE_MAX_UPLOAD_IMAGES} images. Image #1 = cover spread (back | front). Landscape interiors = full facing spreads. Phone camera photos are fine.`;
