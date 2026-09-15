import { RM22_TEMPLATE_ROOT } from "@/lib/talisbooks/rm22-template";
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

export const EBOOK_GENERATE_TEMPLATE_PDF_HREF = `${RM22_TEMPLATE_ROOT}/RM22-Project.pdf`;
export const EBOOK_GENERATE_TEMPLATE_PDF_FILE_NAME = "RM22-Project.pdf";
export const EBOOK_GENERATE_TEMPLATE_ACTION = "Use Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_ACTION_ON = "Using Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_HELP =
  "RM22 layout: pick one product sheet (T-Dome, G-House, or T-House) for the spread after the cover. Replace lime placeholder photos and captions — including Intrinsic Value and the outro.";
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
