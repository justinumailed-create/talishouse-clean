import { describe, expect, it } from "vitest";
import { ADMIN_CONSOLE_METADATA, ADMIN_LOGIN_METADATA } from "../lib/admin-seo";
import { createMetadata } from "../lib/seo";

describe("admin SEO metadata", () => {
  it("overrides root homes marketing copy on the admin console", () => {
    expect(ADMIN_CONSOLE_METADATA.title).toBe("Admin Console | Talispros");
    expect(ADMIN_CONSOLE_METADATA.description).toBe(
      "Talispros admin console. Authorized operators sign in with a FAST code to manage site content, Mapsites, and operations.",
    );
    expect(ADMIN_CONSOLE_METADATA.robots).toMatchObject({ index: false, follow: false });
  });

  it("uses FAST-code login copy on /admin/login", () => {
    expect(ADMIN_LOGIN_METADATA.title).toBe("Admin Login | Talispros");
    expect(ADMIN_LOGIN_METADATA.description).toBe(
      "Sign in to the Talispros admin console with your authorized FAST code.",
    );
    expect(ADMIN_LOGIN_METADATA.robots).toMatchObject({ index: false, follow: false });
  });
});

describe("createMetadata", () => {
  it("omits Open Graph and Twitter images when image is false", () => {
    const meta = createMetadata({
      title: "Mapsite™ AL02",
      description: "Talispros™ Mapsite™ for FAST Code AL02.",
      path: "/mapsite/al02",
      image: false,
    });

    expect(meta.openGraph?.images).toEqual([]);
    expect(meta.twitter).toMatchObject({
      card: "summary",
      title: "Mapsite™ AL02",
      description: "Talispros™ Mapsite™ for FAST Code AL02.",
    });
    expect(meta.twitter && "images" in meta.twitter ? meta.twitter.images : undefined).toBeUndefined();
    expect(meta.alternates?.canonical).toBe("https://www.talishouse.com/mapsite/al02");
  });
});
