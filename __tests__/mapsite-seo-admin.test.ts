import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Mapsite™ SEO admin WhatsApp preview", () => {
  it("splits each FAST Code card with a live iPhone WhatsApp link preview", () => {
    const source = readFileSync(
      resolve("components/talispros-admin/MapSiteSeoAdmin.tsx"),
      "utf8",
    );
    expect(source).toContain("WhatsAppIphonePreview");
    expect(source).toContain("lg:grid-cols-2");
    expect(source).toContain("https://talispros.com");
    expect(source).toContain("title={previewTitle}");
    expect(source).toContain("description={previewDescription}");
    expect(source).toContain("imageUrl={previewImage}");
    expect(source).toContain("liveOgImageUrl");
  });
});
