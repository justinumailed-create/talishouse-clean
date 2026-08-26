import { SELF_SERVICE_MAX_UPLOAD_IMAGES } from "@/lib/talisbooks/self-service-page-plan";

/** Shared copy for the self-service ebook generate page (SSR + client). */
export const EBOOK_GENERATE_HELP_TEXT =
  "Add high-resolution photos or a PDF. Images are optimized automatically — no resizing needed. The first landscape photo (or PDF page 1) is the cover spread: left half = back cover, right half = front cover. Remaining images or PDF pages become the interior.";

export const EBOOK_GENERATE_UPLOAD_HINT = `JPG, PNG, or PDF. Up to ${SELF_SERVICE_MAX_UPLOAD_IMAGES} images. First landscape = cover spread (back | front). Phone camera photos are fine.`;
