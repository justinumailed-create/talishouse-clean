import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";
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
    expect(TALISPROS_START_SEGMENTS.map((segment) => segment.label)).toEqual([
      "Owners / Managers",
      "Licensed",
      "Unlicensed",
      "Adpro™",
    ]);
    expect(TALISPROS_START_SEGMENTS.map((segment) => segment.title)).toEqual([
      "Broker or Team Leader",
      "Real Estate Professional",
      "For-Sale-By-Owner",
      "Product & Service Providers",
    ]);
    expect(TALISPROS_START_SEGMENTS[3]?.title).toBe("Product & Service Providers");
    const sidebar = repoSource("components/talispros/TalisprosStartSidebar.tsx");
    expect(sidebar).toContain("whitespace-nowrap text-[15px]");
    expect(sidebar).toContain("sm:text-[16px]");
    expect(sidebar).not.toContain("lg:text-[20px]");
    for (const segment of TALISPROS_START_SEGMENTS) {
      expect(segment.title.startsWith("I am a")).toBe(false);
      expect(segment.title.startsWith("I am an")).toBe(false);
    }
  });

  it("uses the same audience options in the Markets dropdown", () => {
    expect(TALISPROS_MARKET_OPTIONS).toBe(TALISPROS_START_SEGMENTS);
    const dropdown = repoSource(
      "components/talispros/TalisprosMarketsDropdown.tsx",
    );
    expect(dropdown).toContain("{option.title}");
    expect(dropdown).toContain("{option.label}");
    expect(dropdown).toContain("TALISPROS_MARKET_OPTIONS");
    expect(dropdown).not.toContain("Talishouse™ Builders");
  });
});

describe("Back to Mapsite from a FAST-scoped page", () => {
  it("opens the listings Mapsite for that FAST code", () => {
    expect(mapsiteBackFromScheduleHref("lg01")).toBe(
      "/talispros/mapsite/listings/lg01",
    );
    expect(mapsiteBackFromScheduleHref("rm22")).toBe(
      "/talispros/mapsite/listings/rm22",
    );
    expect(mapsiteBackFromScheduleHref("")).toBe("/talispros/mapsite");
    expect(mapsiteBackFromScheduleHref("demo")).toBe("/talispros/mapsite");

    const talistv = repoSource("app/talistv/page.tsx");
    expect(talistv).toContain("mapsiteBackFromScheduleHref(fastCode)");
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

describe("demo ebook wrap cover", () => {
  it("uses page 1 as wrap cover instead of the pinned Cowboy covers", () => {
    const action = repoSource("app/talispros/demo-mapsite/actions.ts");
    const client = repoSource(
      "components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx",
    );

    expect(action).not.toContain("pinnedTalisBookCoverAsset");
    expect(action).toContain("frontCover: input.frontCover");
    expect(action).toContain("backCover: input.backCover");
    expect(client).toContain("applyWrapCoverFromFiles");
    expect(client).toContain("frontCover: optimizedCovers.front");
    expect(client).toContain("backCover: optimizedCovers.back");
  });
});
