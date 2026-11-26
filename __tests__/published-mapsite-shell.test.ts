import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLISHED_MAPSITE_SHELL } from "../lib/mapsite-layout";

function repoSource(relativePath: string) {
  return readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

describe("published Mapsite shell", () => {
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

  it("greys out the Create New insert-pages block on demonstration Mapsites", () => {
    const createNew = repoSource("components/mapsite/MapSiteCreateNewPanel.tsx");
    expect(createNew).toContain("pageInsertLocked");
    expect(createNew).toContain("data-demo-page-insert-locked");
    expect(createNew).toContain("inert");

    const bottomPanels = repoSource("components/mapsite/MapSiteBottomPanels.tsx");
    expect(bottomPanels).toContain("shouldLockDemoPageInsert");
    expect(bottomPanels).toContain("pageInsertLocked");
    expect(bottomPanels).toContain("MapSiteCreativeLinks");
  });

  it("shows the agency logo above the marketing manager on paid claimed Mapsites", () => {
    const application = repoSource(
      "components/talispros/mapsite/MapSiteApplication.tsx",
    );
    expect(application).toContain("MapSiteMarketPartnerCard");
    expect(application).toContain("paid={paid}");
    expect(application).not.toContain("ACTIVATION_REVEAL_DELAY_MS");
    expect(application).not.toContain("paymentDelayElapsed");
    expect(application).not.toContain("MapSiteExpressInterestCard");
    expect(application).toContain("overscroll-none");

    const partnerCard = repoSource(
      "components/talispros/mapsite/MapSiteMarketPartnerCard.tsx",
    );
    expect(partnerCard).toContain("MapSiteAgencyLogo");
    expect(partnerCard).toContain("paid ?");
    expect(partnerCard).toContain("bg-[#f2f2f0]");
    expect(partnerCard).not.toContain("mapsite-cloud-vignette");
    expect(partnerCard).not.toContain("backdrop-blur");
  });

  it("scroll-locks the claimed Mapsite viewport", () => {
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

  it("claimed pin cards show the label and buttons only, with no listing photo or write-up", () => {
    const popup = repoSource(
      "components/talispros/mapsite/MapSitePropertyPopup.tsx",
    );
    expect(popup).toContain("data-testid=\"mapsite-pin-card-title\"");
    expect(popup).toContain("{popupTitle}");
    expect(popup).not.toContain("popupWriteup");
    expect(popup).toContain("useGenericCard ? genericHeroImage : null");
    // Shrink-wrap the flag above the pin; do not stretch a frosted gap to a fixed height.
    expect(popup).not.toContain("height: cardHeight");
    expect(popup).toContain("data-pin-flag");
    expect(popup).toContain("-translate-y-full");
    expect(popup).toContain("alignTop + cardHeight + MAPSITE_POPUP_TIP_HEIGHT_PX");
    // Match /mapsites (DemoHeroMap) button hover and inner spacing.
    expect(popup).toContain("transition hover:bg-[#0558b3]");
    expect(popup).toContain("px-3.5 pb-3 pt-2");
    expect(popup).toContain("mt-2.5");
  });
});
