import { JARLBERG_TEMPLATE_ROOT } from "@/lib/talisbooks/jarlberg-template";
import {
  SELF_SERVICE_MAX_UPLOAD_IMAGES,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";

/** Shared copy for the self-service ebook generate page (SSR + client). */
export const EBOOK_GENERATE_HELP_TEXT =
  "Add a PDF or images. The first page is the wrap cover — left back, right front. The rest become the book.";

export const EBOOK_GENERATE_UPLOAD_HINT = `PDF, JPG, PNG, or WEBP. Up to ${SELF_SERVICE_MAX_UPLOAD_IMAGES} interior pages.`;

export const EBOOK_GENERATE_COVER_HELP =
  "Front and back covers appear here after upload.";

export const EBOOK_GENERATE_COVER_PDF_HELP =
  "Page 1 wrap: left = back cover, right = front cover.";

export const EBOOK_GENERATE_TEMPLATE_PDF_HREF = `${JARLBERG_TEMPLATE_ROOT}/Jarlberg-Project.pdf`;
export const EBOOK_GENERATE_TEMPLATE_PDF_FILE_NAME = "Jarlberg-Project.pdf";
export const EBOOK_GENERATE_TEMPLATE_ACTION = "Use Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_ACTION_ON = "Using Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_HELP =
  "Jarlberg layout: replace covers, photos, and copy. Page 1 keeps the dome and uses your Mapsite™ pin as the map.";
export const EBOOK_GENERATE_TEMPLATE_DOWNLOAD = "Download PDF template";
export const EBOOK_GENERATE_TEMPLATE_PAGE_PLACEHOLDER =
  "Caption or copy for this page";
export const EBOOK_GENERATE_TEMPLATE_ADD_PAGE = "Add interior page";

export function captionsFromTemplatePages(
  texts: Array<string | undefined | null>,
): SelfServicePageCaption[] {
  return texts.map((value) => {
    const text = typeof value === "string" ? value.trim() : "";
    return { text, skipped: text.length === 0 };
  });
}
