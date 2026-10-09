import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import {
  DEMO_MAPSITE_PDF_HREF,
  DEMO_TEMPLATE_GOOGLE_SLIDES_COPY_HREF,
  DEMO_TEMPLATE_KEYNOTE_HREF,
  DEMO_TEMPLATE_PPTX_HREF,
} from "@/lib/talispros/demo-mapsite";

const publicFile = (href: string) => join(process.cwd(), "public", href.replace(/^\//, ""));

describe("Download Demo PDF menu with Replace Image templates", () => {
  it("ships the PowerPoint and Keynote templates next to the Demo PDF", () => {
    for (const href of [DEMO_MAPSITE_PDF_HREF, DEMO_TEMPLATE_PPTX_HREF, DEMO_TEMPLATE_KEYNOTE_HREF]) {
      expect(existsSync(publicFile(href)), href).toBe(true);
      expect(statSync(publicFile(href)).size).toBeGreaterThan(100_000);
    }
    expect(DEMO_TEMPLATE_PPTX_HREF).toMatch(/\.pptx$/);
    expect(DEMO_TEMPLATE_KEYNOTE_HREF).toMatch(/\.key$/);
  });

  it("links Google Slides as a make-a-copy URL", () => {
    expect(DEMO_TEMPLATE_GOOGLE_SLIDES_COPY_HREF).toMatch(
      /^https:\/\/docs\.google\.com\/presentation\/d\/[\w-]+\/copy$/,
    );
  });

  it("offers PDF, PowerPoint, Keynote and Google Slides (new tab) from the builder", () => {
    const menu = readFileSync(
      join(process.cwd(), "components/talispros/demo-mapsite/DemoDownloadMenu.tsx"),
      "utf8",
    );
    expect(menu).toContain("DEMO_MAPSITE_PDF_HREF");
    expect(menu).toContain("DEMO_TEMPLATE_PPTX_HREF");
    expect(menu).toContain("DEMO_TEMPLATE_KEYNOTE_HREF");
    expect(menu).toMatch(/DEMO_TEMPLATE_GOOGLE_SLIDES_COPY_HREF\}\s*target="_blank"/);
    const builder = readFileSync(
      join(process.cwd(), "components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).toContain("<DemoDownloadMenu");
  });

  it("has EN and DE labels", () => {
    expect(en.demo.downloadPdf).toBe("Download Demo PDF");
    expect(en.demo.downloadMenuPptx).toContain("PowerPoint");
    expect(en.demo.downloadMenuKeynote).toContain("Keynote");
    expect(en.demo.downloadMenuGoogleSlides).toContain("Google Slides");
    expect(de.demo.downloadMenuTemplates).toBe("Vorlagen zum Bilder-Ersetzen");
    expect(de.demo.downloadMenuGoogleSlides).toContain("Kopie erstellen");
    expect(de.demo.downloadMenuHint).toContain("20");
  });
});
