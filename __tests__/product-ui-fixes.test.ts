import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TALISPROS_START_SEGMENTS } from "@/lib/talispros/start-content";

function repoSource(relativePath: string) {
  return readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

describe("ebook viewer Dashboard button", () => {
  it("is not rendered for any role, including admin", () => {
    const shell = repoSource(
      "components/talisbooks/viewer/TalisBooksViewerShell.tsx",
    );
    const page = repoSource("app/talisbooks/viewer/[slug]/page.tsx");

    expect(shell).not.toContain("showDashboard");
    expect(shell).not.toMatch(/>\s*Dashboard\s*</);
    expect(page).not.toContain("showDashboard");
  });
});

describe("home right rail audience labels", () => {
  it("drops the I am a / I am an prefix and keeps the rest", () => {
    expect(TALISPROS_START_SEGMENTS.map((segment) => segment.title)).toEqual([
      "Broker or Team Leader",
      "Real Estate Professional",
      "For-Sale-By-Owner Seller",
      "Adpros Service Provider",
    ]);
    for (const segment of TALISPROS_START_SEGMENTS) {
      expect(segment.title.startsWith("I am a")).toBe(false);
      expect(segment.title.startsWith("I am an")).toBe(false);
    }
  });
});

describe("published Mapsite agent photo crop", () => {
  it("keeps the person intact and does not cover-crop the headshot", () => {
    const photo = repoSource("components/mapsite/MapSiteAgentPhoto.tsx");
    const cutout = repoSource("lib/media/cutout-agent-photo.ts");

    expect(photo).toContain("object-contain object-center");
    expect(photo).not.toContain("object-cover");
    expect(photo).not.toContain("scale-[1.38]");
    expect(cutout).not.toContain("zoomedCropRect");
    expect(cutout).toContain("subject stays intact");
  });
});
