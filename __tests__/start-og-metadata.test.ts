import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createMetadata, siteConfig } from "../lib/seo";
import { buildPageMetadata } from "../lib/seo/page-seo";
import {
  isLargeBrandLogoUrl,
  toAbsoluteHttpsOgUrl,
} from "../lib/talispros/mapsite-og-image";

describe("homepage Open Graph image", () => {
  it("uses the dedicated home share card (EN + DE), not the brand logo", () => {
    const page = readFileSync(resolve("app/page.tsx"), "utf8");
    expect(page).toContain('pageMetadata("/")');
    expect(page).not.toContain("/logo.png");
    expect(page).not.toContain("/seo/talispros-og");
    for (const locale of ["en", "de"] as const) {
      const meta = buildPageMetadata("/", locale);
      const [image] = meta.openGraph?.images as Array<{ url: string; width: number; height: number }>;
      expect(image).toMatchObject({
        url: `https://www.talispros.com/og/pages/home-${locale}.jpg`,
        width: 1200,
        height: 630,
      });
      expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    }
    // The old screenshot card stays valid for any external references.
    expect(toAbsoluteHttpsOgUrl("/assets/start-og.png?v=5")).toBe(
      "https://www.talispros.com/assets/start-og.png?v=5",
    );
  });

  it("keeps start-og.png under ~300KB at 1200×630 so scrapers do not fall back", () => {
    const file = resolve("public/assets/start-og.png");
    const size = statSync(file).size;
    expect(size).toBeLessThan(300 * 1024);
    expect(size).toBeGreaterThan(20 * 1024);
  });
});

describe("sitewide default OG", () => {
  it("defaults to the composed brand card, never the oversized standalone logo poster", () => {
    expect(siteConfig.ogImage).toBe("https://www.talispros.com/api/og/talispros");
    expect(isLargeBrandLogoUrl("/logo.png")).toBe(true);
    expect(isLargeBrandLogoUrl("/seo/talispros-og.jpg")).toBe(true);
    expect(isLargeBrandLogoUrl(siteConfig.ogImage)).toBe(true); // flagged for mapsite scenic only
    expect(siteConfig.ogImage).not.toContain("/logo.png");
    expect(siteConfig.ogImage).not.toContain("/seo/talispros-og");

    const meta = createMetadata({
      title: "Example",
      description: "Example page",
      path: "/example",
    });
    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe(siteConfig.ogImage);
    expect(images?.[0]?.url).not.toMatch(/\/logo\.png$/);
    expect(images?.[0]?.url).not.toContain("/seo/talispros-og");
  });
});
