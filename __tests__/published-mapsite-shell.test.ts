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
    expect(layout).toContain("shouldLockDemoPageInsert");
  });

  it("greys out the Create New insert-pages block on demonstration Mapsites™", () => {
    const createNew = repoSource("components/mapsite/MapSiteCreateNewPanel.tsx");
    expect(createNew).toContain("pageInsertLocked");
    expect(createNew).toContain("data-demo-page-insert-locked");
    expect(createNew).toContain("inert");

    const bottomPanels = repoSource("components/mapsite/MapSiteBottomPanels.tsx");
    expect(bottomPanels).toContain("shouldLockDemoPageInsert");
    expect(bottomPanels).toContain("pageInsertLocked");
    expect(bottomPanels).toContain("MapSiteCreativeLinks");
  });

  it("shows the agency logo above the marketing manager on paid claimed Mapsites™", () => {
    const application = repoSource(
      "components/talispros/mapsite/MapSiteApplication.tsx",
    );
    expect(application).toContain("MapSiteMarketPartnerCard");
    expect(application).toContain("paid={paid}");
    expect(application).not.toContain("MapSiteExpressInterestCard");
    expect(application).toContain("overscroll-none");

    const partnerCard = repoSource(
      "components/talispros/mapsite/MapSiteMarketPartnerCard.tsx",
    );
    expect(partnerCard).toContain("MapSiteAgencyLogo");
    expect(partnerCard).toContain("paid ?");
    expect(partnerCard).toContain("mapsite-cloud-vignette");
  });

  it("scroll-locks the claimed Mapsite™ viewport", () => {
    const layout = repoSource("app/talispros/mapsite/layout.tsx");
    expect(layout).toContain("MapSiteViewportLock");
    expect(layout).toContain("mapsite-app-shell");
    expect(layout).toContain("overflow-hidden");

    const sidebar = repoSource(
      "components/talispros/mapsite/MapSiteListingSidebar.tsx",
    );
    expect(sidebar).toContain("overflow-y-auto");
    expect(sidebar).toContain("stopMapScrollSteal");

    const application = repoSource(
      "components/talispros/mapsite/MapSiteApplication.tsx",
    );
    expect(application).toContain("scrollZoom={false}");
  });
});
