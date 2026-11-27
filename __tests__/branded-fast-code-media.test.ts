import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createMetadata } from "../lib/seo";
import { TSPLITS_OG_IMAGE_URL } from "../lib/seo/page-seo";
import {
  applyBrandedFastCodeShareMetadata,
  brandedFastCodeOgUrl,
  isBrandedFastCodeHomeMedia,
} from "../lib/talispros/branded-fast-code-media";

const RM22_HOME =
  "https://vmdcptktlzauhowplyny.supabase.co/storage/v1/object/public/talisbooks-assets/personal-home/rm22-home.webp";
const DC06_HOME =
  "https://vmdcptktlzauhowplyny.supabase.co/storage/v1/object/public/talisbooks-assets/personal-home/dc06-home.webp";

const WINDSWEPT = TSPLITS_OG_IMAGE_URL;

function repo(rel: string) {
  return readFileSync(resolve(rel), "utf8");
}

function windsweptMetadata(path: string) {
  return createMetadata({
    title: "Example page",
    description: "Example description.",
    path,
  });
}

describe("branded FAST code home media allowlist", () => {
  it("matches rm22 and dc06 case-insensitively, and no other codes", () => {
    expect(isBrandedFastCodeHomeMedia("rm22")).toBe(true);
    expect(isBrandedFastCodeHomeMedia("RM22")).toBe(true);
    expect(isBrandedFastCodeHomeMedia("  Dc06 ")).toBe(true);
    expect(isBrandedFastCodeHomeMedia("dc06")).toBe(true);
    expect(isBrandedFastCodeHomeMedia("AB12")).toBe(false);
    expect(isBrandedFastCodeHomeMedia("ab12")).toBe(false);
    expect(isBrandedFastCodeHomeMedia("rm21")).toBe(false);
    expect(isBrandedFastCodeHomeMedia("")).toBe(false);
    expect(isBrandedFastCodeHomeMedia(null)).toBe(false);
  });
});

describe("MapSiteTopBar is unchanged", () => {
  it("still uses the header fallback logo and has no branded logo swap", () => {
    const src = repo("components/mapsite/MapSiteTopBar.tsx");
    expect(src).toContain("MAPSITE_HEADER_FALLBACK_LOGO");
    expect(src).toContain("logoUrl?.trim() || MAPSITE_HEADER_FALLBACK_LOGO");
    expect(src).not.toContain("resolveBrandedTopBarLogo");
    expect(src).not.toContain("loadBrandedFastCodeHomeImageUrl");
    expect(src).not.toContain("branded-fast-code-media");
  });
});

describe("Open Graph and Twitter images for RM22 and DC06 only", () => {
  it("overrides og:image and twitter.images for each allowlisted code, without touching icons", () => {
    for (const code of ["RM22", "dc06"] as const) {
      const home = code.toLowerCase() === "rm22" ? RM22_HOME : DC06_HOME;
      const base = windsweptMetadata(`/home/${code.toLowerCase()}`);
      const meta = applyBrandedFastCodeShareMetadata(base, {
        fastCode: code,
        homeImageUrl: home,
        alt: `${code} homepage`,
      });
      const ogUrl = brandedFastCodeOgUrl(code);
      const images = meta.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
      }>;
      expect(ogUrl).toBe(
        `https://www.tsplits.com/api/og/fast-code-home/${code.toLowerCase()}`,
      );
      expect(images).toEqual([
        { url: ogUrl, width: 1200, height: 630, alt: `${code} homepage` },
      ]);
      expect(
        meta.twitter && "images" in meta.twitter ? meta.twitter.images : undefined,
      ).toEqual([ogUrl]);
      expect(meta.icons).toBeUndefined();
      expect(meta.icons).toBe(base.icons);
    }
  });

  it("leaves other FAST codes on the shared Windswept card", () => {
    const base = windsweptMetadata("/home/ab12");
    const meta = applyBrandedFastCodeShareMetadata(base, {
      fastCode: "AB12",
      homeImageUrl: RM22_HOME,
      alt: "Should not apply",
    });
    expect(meta).toBe(base);
    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe(WINDSWEPT);
    expect(
      meta.twitter && "images" in meta.twitter ? meta.twitter.images : undefined,
    ).toEqual([WINDSWEPT]);
    expect(meta.icons).toBeUndefined();
  });

  it("does not override metadata when an allowlisted code has no homepage image", () => {
    const base = windsweptMetadata("/home/rm22");
    const meta = applyBrandedFastCodeShareMetadata(base, {
      fastCode: "rm22",
      homeImageUrl: "  ",
      alt: "RM22",
    });
    expect(meta).toBe(base);
  });

  it("keeps createMetadata on the shared Windswept card for everyone", () => {
    const meta = createMetadata({
      title: "Mapsite RM22",
      description: "Should still ignore a custom image argument.",
      path: "/map/rm22",
      image: RM22_HOME,
    });
    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe(WINDSWEPT);
  });
});

describe("branded FAST code OG preview is wired only on home, map, and mapsite routes", () => {
  it("applies share metadata on /home, /map, and /mapsite", () => {
    expect(repo("app/home/[fastCode]/page.tsx")).toContain(
      "applyBrandedFastCodeShareMetadata",
    );
    expect(repo("app/map/[fastCode]/page.tsx")).toContain(
      "applyBrandedFastCodeShareMetadata",
    );
    expect(repo("components/mapsite/PublishedMapSiteView.tsx")).toContain(
      "applyBrandedFastCodeShareMetadata",
    );
  });

  it("does not add a per-route favicon route or change global favicon files", () => {
    expect(existsSync(resolve("app/api/icon/fast-code/[fastCode]/route.ts"))).toBe(
      false,
    );
    expect(repo("lib/talispros/branded-fast-code-media.ts")).not.toContain("icons:");
    expect(repo("lib/talispros/branded-fast-code-media.ts")).not.toContain(
      "brandedFastCodeIcon",
    );
    expect(repo("app/layout.tsx")).toContain("/favicon-v2.ico");
    expect(repo("app/layout.tsx")).toContain("/favicon-v2.png");
    expect(repo("app/talispros/layout.tsx")).toContain("/favicon-v2.ico");
    expect(repo("app/talispros/layout.tsx")).toContain("/favicon-v2.png");
    const ogRoute = repo("app/api/og/fast-code-home/[fastCode]/route.ts");
    expect(ogRoute).toContain("isBrandedFastCodeHomeMedia");
    expect(ogRoute).toContain("status: 404");
  });
});
