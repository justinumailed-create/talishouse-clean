import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_CONSOLE_METADATA, ADMIN_LOGIN_METADATA } from "../lib/admin-seo";
import { createMetadata } from "../lib/seo";

describe("admin SEO metadata", () => {
  it("overrides root homes marketing copy on the admin console", () => {
    expect(ADMIN_CONSOLE_METADATA.title).toBe("Admin Console | Tsplits™");
    expect(ADMIN_CONSOLE_METADATA.description).toBe(
      "Tsplits™ admin console. Authorized operators sign in with a FAST code to manage site content, Mapsites, and operations.",
    );
    expect(ADMIN_CONSOLE_METADATA.robots).toMatchObject({ index: false, follow: false });
  });

  it("uses FAST-code login copy on /admin/login", () => {
    expect(ADMIN_LOGIN_METADATA.title).toBe("Admin Login | Tsplits™");
    expect(ADMIN_LOGIN_METADATA.description).toBe(
      "Sign in to the Tsplits™ admin console with your authorized FAST code.",
    );
    expect(ADMIN_LOGIN_METADATA.robots).toMatchObject({ index: false, follow: false });
  });
});

describe("createMetadata", () => {
  it("uses the shared Windswept card even when a caller passes image: false", () => {
    const meta = createMetadata({
      title: "Mapsite AL02",
      description: "Tsplits™ Mapsite for FAST Code AL02.",
      path: "/mapsite/al02",
      image: false,
    });

    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe("https://www.tsplits.com/og/tsplits-windswept.jpg");
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Mapsite AL02",
      description: "Tsplits™ Mapsite for FAST Code AL02.",
    });
    expect(meta.twitter && "images" in meta.twitter ? meta.twitter.images : undefined).toEqual([
      "https://www.tsplits.com/og/tsplits-windswept.jpg",
    ]);
    expect(meta.alternates?.canonical).toBe("https://www.tsplits.com/mapsite/al02");
  });
});

describe("Talisbooks™ viewer share metadata", () => {
  it("keeps unique book titles and descriptions, and uses the shared Windswept card", () => {
    const page = readFileSync(
      resolve("app/talisbooks/viewer/[slug]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("createMetadata");
    expect(page).toContain("description: book.description");
    const meta = createMetadata({
      title: "Example Book | Talisbooks™",
      description: "A Talisbook on Tsplits™.",
      path: "/talisbooks/viewer/example",
      image: { url: "https://cdn.example/cover.jpg", width: 1200, height: 630, alt: "Cover" },
    });
    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe("https://www.tsplits.com/og/tsplits-windswept.jpg");
    expect(meta.alternates?.canonical).toBe(
      "https://www.tsplits.com/talisbooks/viewer/example",
    );
  });
});
