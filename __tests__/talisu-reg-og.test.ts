import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTalisUMetadata } from "../lib/talisu/seo";
import { getDictionary } from "../lib/i18n/dictionaries";

describe("/talisu/reg share metadata", () => {
  for (const locale of ["en", "de"] as const) {
    it(`uses the dedicated Aisha card (${locale})`, () => {
      const m = getDictionary(locale).meta.talisuRegister;
      expect(
        existsSync(path.join(process.cwd(), "public", m.ogImage)),
      ).toBe(true);
      expect(m.title).not.toMatch(/Mapsite™/);
      expect(m.description).not.toMatch(/USD|Mapsite™/);
      const meta = createTalisUMetadata({
        title: m.title,
        description: m.description,
        path: "/talisu/reg",
        locale,
        image: { url: m.ogImage, width: 1200, height: 630, alt: m.ogImageAlt },
      });
      const og = meta.openGraph as Record<string, unknown>;
      const [image] = og.images as Array<Record<string, unknown>>;
      expect(image).toMatchObject({
        url: `https://www.talispros.com${m.ogImage}`,
        width: 1200,
        height: 630,
        alt: m.ogImageAlt,
      });
      expect(og.locale).toBe(locale === "de" ? "de_DE" : "en_US");
      expect(og.alternateLocale).toEqual([locale === "de" ? "en_US" : "de_DE"]);
      expect(og.url).toBe(
        locale === "de"
          ? "https://www.talispros.com/talisu/reg?lang=de"
          : "https://www.talispros.com/talisu/reg",
      );
      expect((meta.twitter as Record<string, unknown>).card).toBe(
        "summary_large_image",
      );
    });
  }
});
