import { RM22_TEMPLATE_ROOT } from "@/lib/talisbooks/rm22-template";
import {
  SELF_SERVICE_MAX_UPLOAD_IMAGES,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";

/** Shared copy for the self-service ebook generate page (SSR + client). */
export const EBOOK_GENERATE_HELP_INSTRUCTION = "Add a PDF or images.";

export const EBOOK_GENERATE_HELP_EXPLANATION =
  "The first page is a wrap cover — left side back cover, right side front cover. All other pages become the book.";

export const EBOOK_GENERATE_HELP_TEXT = `${EBOOK_GENERATE_HELP_INSTRUCTION} ${EBOOK_GENERATE_HELP_EXPLANATION}`;

export const EBOOK_GENERATE_UPLOAD_HINT = `PDF, JPG, JPEG, or PNG. Up to ${SELF_SERVICE_MAX_UPLOAD_IMAGES} interior pages.`;

export const EBOOK_GENERATE_COVER_HELP =
  "Front and back covers appear here after upload.";

export const EBOOK_GENERATE_COVER_PDF_HELP =
  "Page 1 wrap: left = back cover, right = front cover.";

export const EBOOK_GENERATE_TEMPLATE_PDF_HREF = `${RM22_TEMPLATE_ROOT}/RM22-Project.pdf`;
export const EBOOK_GENERATE_TEMPLATE_PDF_FILE_NAME = "RM22-Project.pdf";
export const EBOOK_GENERATE_TEMPLATE_ACTION = "Use Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_ACTION_ON = "Using Talisbook™ template";
export const EBOOK_GENERATE_TEMPLATE_HELP =
  "Choose the Talisbook™ template. After the cover, select one product sheet: T-Dome, G-House, or T-House. You can replace the placeholder photos and edit the captions and copy where the template allows. Every book ends with Intrinsic Value, then The Parting Shot…!, then the back cover.";
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
