import { describe, expect, it } from "vitest";
import {
  captionsFromTemplatePages,
  EBOOK_GENERATE_COVER_HELP,
  EBOOK_GENERATE_COVER_PDF_HELP,
  EBOOK_GENERATE_HELP_TEXT,
  EBOOK_GENERATE_TEMPLATE_ACTION,
  EBOOK_GENERATE_TEMPLATE_HELP,
  EBOOK_GENERATE_TEMPLATE_PDF_HREF,
  EBOOK_GENERATE_UPLOAD_HINT,
} from "../lib/talispros/ebook-generate-copy";
import { PDF_NEEDS_INTERIOR_PAGES_MESSAGE } from "../lib/talisbooks/pdf-pages-to-images";

describe("self-service ebook generate copy", () => {
  it("describes PDF or image uploads with wrap-cover page 1", () => {
    expect(EBOOK_GENERATE_HELP_TEXT).toContain("PDF or images");
    expect(EBOOK_GENERATE_HELP_TEXT).toContain("wrap cover");
    expect(EBOOK_GENERATE_UPLOAD_HINT).toContain("PDF, JPG, PNG, or WEBP");
    expect(EBOOK_GENERATE_COVER_HELP).toContain("Front and back covers");
    expect(EBOOK_GENERATE_COVER_PDF_HELP).toContain("left = back cover");
    expect(PDF_NEEDS_INTERIOR_PAGES_MESSAGE).toContain("at least two");
  });

  it("describes the per-page template flow", () => {
    expect(EBOOK_GENERATE_TEMPLATE_ACTION).toContain("template");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("T-Dome");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("G-House");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("T-House");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("Parting Shot");
    expect(EBOOK_GENERATE_TEMPLATE_PDF_HREF).toBe(
      "/talisbooks/templates/rm22/RM22-Project.pdf",
    );
    expect(captionsFromTemplatePages([" Lake ", "", null])).toEqual([
      { text: "Lake", skipped: false },
      { text: "", skipped: true },
      { text: "", skipped: true },
    ]);
  });
});
