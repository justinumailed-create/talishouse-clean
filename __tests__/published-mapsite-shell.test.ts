import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLISHED_MAPSITE_SHELL } from "../lib/mapsite-layout";

function repoSource(relativePath: string) {
  return readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

describe("published Mapsite™ shell", () => {
  it("always renders the RM22 creative chrome, not the unpaid Play Video / Register panels", () => {
    expect(PUBLISHED_MAPSITE_SHELL).toBe("rm22-creative");

    const bottomPanels = repoSource("components/mapsite/MapSiteBottomPanels.tsx");
    expect(bottomPanels).toContain("MapSiteCreativeLinks");
    expect(bottomPanels).toContain("MapSiteCreateNewPanel");
    expect(bottomPanels).toContain("data-mapsite-published-shell");
    expect(bottomPanels).toContain("PUBLISHED_MAPSITE_SHELL");
    expect(bottomPanels).not.toMatch(/paymentReceived/);
    expect(bottomPanels).not.toContain("Play Video");
    expect(bottomPanels).not.toContain("Image Gallery");
    expect(bottomPanels).not.toContain("MapSiteContextPanel");
    expect(bottomPanels).not.toContain("TEST Account");

    const publishedView = repoSource("components/mapsite/PublishedMapSiteView.tsx");
    expect(publishedView).not.toContain("hasCompletedMapSiteActivationPayment");
    expect(publishedView).not.toContain("paymentReceived");

    const layout = repoSource("components/mapsite/MapSiteLayout.tsx");
    expect(layout).not.toMatch(/paymentReceived/);
    expect(layout).toContain("MapSiteBottomPanels");
  });
});
