import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  captionsFromTemplatePages,
  EBOOK_GENERATE_COVER_HELP,
  EBOOK_GENERATE_COVER_PDF_HELP,
  EBOOK_GENERATE_HELP_EXPLANATION,
  EBOOK_GENERATE_HELP_INSTRUCTION,
  EBOOK_GENERATE_HELP_TEXT,
  EBOOK_GENERATE_TEMPLATE_ACTION,
  EBOOK_GENERATE_TEMPLATE_HELP,
  EBOOK_GENERATE_TEMPLATE_PDF_HREF,
  EBOOK_GENERATE_UPLOAD_HINT,
} from "../lib/talispros/ebook-generate-copy";
import { PDF_NEEDS_INTERIOR_PAGES_MESSAGE } from "../lib/talisbooks/pdf-pages-to-images";

describe("self-service ebook generate copy", () => {
  it("describes PDF or image uploads with wrap-cover page 1", () => {
    expect(EBOOK_GENERATE_HELP_INSTRUCTION).toBe("Add a PDF or images.");
    expect(EBOOK_GENERATE_HELP_EXPLANATION).toBe(
      "The first page is a wrap cover — left side back cover, right side front cover. All other pages become the book.",
    );
    expect(EBOOK_GENERATE_HELP_TEXT).toContain("PDF or images");
    expect(EBOOK_GENERATE_HELP_TEXT).toContain("wrap cover");
    expect(EBOOK_GENERATE_UPLOAD_HINT).toContain("PDF, JPG, JPEG, or PNG");
    expect(EBOOK_GENERATE_UPLOAD_HINT).not.toMatch(/WEBP|HEIC|HEIF/i);
    expect(EBOOK_GENERATE_COVER_HELP).toContain("Front and back covers");
    expect(EBOOK_GENERATE_COVER_PDF_HELP).toContain("left = back cover");
    expect(PDF_NEEDS_INTERIOR_PAGES_MESSAGE).toContain("at least two");
  });

  it("describes the per-page template flow for a first-time user", () => {
    expect(EBOOK_GENERATE_TEMPLATE_ACTION).toContain("template");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("Talisbook™ template");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("T-Dome");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("G-House");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("T-House");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("Parting Shot");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).toContain("Intrinsic Value");
    expect(EBOOK_GENERATE_TEMPLATE_HELP).not.toMatch(/RM22/);
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

describe("Mapsite™ admin ebook editor", () => {
  it("embeds the Build-page Talisbook™ template generator", () => {
    const panel = readFileSync(
      resolve("components/talispros-admin/MapSiteAdminEbookPanel.tsx"),
      "utf8",
    );
    const generate = readFileSync(
      resolve("components/talispros/EbookGenerateClient.tsx"),
      "utf8",
    );
    const pipeline = readFileSync(
      resolve("lib/talispros/ebook-generation-pipeline.ts"),
      "utf8",
    );
    expect(panel).toContain("EbookGenerateClient");
    expect(panel).toContain("embedded");
    expect(panel).not.toContain("Create Talisbook™");
    expect(panel).not.toContain("no Build Request");
    expect(generate).toContain("embedded = false");
    expect(generate).toContain("Talisbook™ template");
    expect(generate).toContain("loadRm22Template");
    expect(pipeline).toContain("asAdmin: await canEditMapSite(ctx.fastCode)");
    expect(generate).toContain("replaceBookId");
    expect(panel).toContain("Edit existing");
    expect(panel).toContain("Create another");
    expect(panel).toContain("existingInteriorUrls");
    expect(panel).toContain("editExisting && initialEbook ? initialEbook.id : null");
    const autoDraft = readFileSync(
      resolve("lib/talisbooks/auto-draft-ebook.ts"),
      "utf8",
    );
    expect(autoDraft).toContain("shouldBindMapsiteTebListing");
    expect(autoDraft).toContain("!input.replaceBookId?.trim() && !input.asAdmin");
    expect(autoDraft).toContain("ebookInsertPublishFields");
  });

  it("sizes RM22 cover previews to the Talisbooks™ viewer page leaf", () => {
    const fields = readFileSync(
      resolve("components/talispros/Rm22TemplateFields.tsx"),
      "utf8",
    );
    expect(fields).toContain("RM22_VIEWER_COVER_ASPECT");
    expect(fields).not.toContain("1080 / 1920");
    expect(fields).not.toContain("w-[30%]");
    expect(readFileSync(resolve("lib/talisbooks/rm22-layout.ts"), "utf8")).toContain(
      "RM22_DOCUMENT_LEAF_WIDTH} / ${RM22_DOCUMENT_LEAF_HEIGHT",
    );
  });
});
