import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { canChangeMapsiteDashboardView } from "../lib/talispros/mapsite-dashboard-view";
import { aishaInvitationParts } from "../lib/talispros/aisha-invitation";

describe("mapsite dashboard view ownership", () => {
  it("allows the owner and a Mapsites admin, and refuses everyone else", () => {
    expect(canChangeMapsiteDashboardView({ isMapsAdmin: false, isOwner: true })).toBe(true);
    expect(canChangeMapsiteDashboardView({ isMapsAdmin: true, isOwner: false })).toBe(true);
    expect(canChangeMapsiteDashboardView({ isMapsAdmin: false, isOwner: false })).toBe(false);
  });

  it("keeps the server check and does not render the switch on a Mapsite", () => {
    const action = readFileSync(resolve("app/admin/mapsites/dashboard-view-actions.ts"), "utf8");
    const app = readFileSync(resolve("components/talispros/mapsite/MapSiteApplication.tsx"), "utf8");
    const card = readFileSync(resolve("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"), "utf8");
    expect(action).toContain("isOwnMapSite");
    expect(action).toContain("canChangeMapsiteDashboardView");
    expect(action).not.toContain("override-config");
    expect(app).not.toContain("MapSiteOwnerDashboardToggle");
    expect(app).not.toContain("dashboardItems=");
    expect(card).toContain("data-testid=\"mapsite-card-dashboard\"");
    expect(app).toContain("MapSiteZoomControls");
    expect(en.mapsite.zoomIn).toBe("Zoom in");
    expect(en.mapsite.zoomOut).toBe("Zoom out");
    expect(de.mapsite.zoomIn).toBe("Vergrößern");
    expect(de.mapsite.zoomOut).toBe("Verkleinern");
    expect(en.mapsite.dashboardView.label).not.toMatch(/—/);
    expect(de.mapsite.dashboardView.label).not.toMatch(/—/);
  });
});

describe("Aisha invitation bubble", () => {
  it("keeps the exact sentences and gives the first one its own weight", () => {
    const widget = readFileSync(resolve("components/talispros/AishaConvaiWidget.tsx"), "utf8");
    const banner = readFileSync(resolve("lib/talispros/hide-elevenlabs-banner.ts"), "utf8");
    for (const line of [
      en.home.assistants.aisha.greeting,
      en.home.assistants.aisha.callback,
      de.home.assistants.aisha.greeting,
      de.home.assistants.aisha.callback,
    ]) {
      const parts = aishaInvitationParts(line);
      const joined = parts.rest ? `${parts.lead} ${parts.rest}` : parts.lead;
      expect(joined).toBe(line);
      expect(parts.lead.endsWith(".")).toBe(true);
    }
    expect(widget).toContain("aisha-convai-lead");
    expect(widget).not.toMatch(/override-config|overrideConfig/);
    expect(banner).toContain("aisha-call-pill");
    expect(banner).toContain("elevenlabs.io");
    expect(widget).not.toContain("override-config=");
  });
});
