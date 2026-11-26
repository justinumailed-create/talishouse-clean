import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Mapsite owner Dashboard page", () => {
  it("is a full-page editor with every owner tool and Back, Close, Restore", () => {
    const page = read("components/talispros/mapsite/MapSiteOwnerDashboard.tsx");
    expect(page).toContain('data-testid="mapsite-owner-dashboard"');
    expect(page).toContain('data-testid="mapsite-dashboard-back"');
    expect(page).toContain('data-testid="mapsite-dashboard-close"');
    expect(page).toContain('data-testid="mapsite-dashboard-restore"');
    expect(page).toContain("copy.restore");
    expect(page).toContain("copy.back");
    expect(page).toContain("copy.close");
    const en = read("lib/i18n/dictionaries/en.ts");
    expect(en).toContain("Restore to previous");
    expect(page).toContain("data-testid={`mapsite-dashboard-tab-${item.id}`}");
    for (const id of ["pins", "links", "ebooks", "bookshelf", "branding", "categories", "partners"]) {
      expect(page).toContain(`id: "${id}"`);
    }

    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("MapSiteOwnerDashboard");
    expect(app).toContain("MapSitePinDashboard");
    expect(app).toContain("MapSiteListingLinksEditor");
    expect(app).toContain("MapSiteEbookEditorPanel");
    expect(app).toContain("MapSiteBookshelfEditor");
    expect(app).toContain("MapSiteLogoImageEditor");
    expect(app).toContain("MapSiteCategoryEditor");
    expect(app).toContain("MapSitePartnerPanel");
    expect(read("components/talispros/mapsite/MapSiteListingLinksEditor.tsx")).toContain("saveMapSiteListingLinksAction");
    expect(app).not.toContain("talkHref=");

    const actions = read("app/talispros/mapsite/dashboard-actions.ts");
    expect(actions).toContain("saveMapSiteListingLinksAction");
    expect(actions).toContain("mls_url");
  });

  it("moves Talk to us from the navbar onto the left partner card", () => {
    const card = read("components/talispros/mapsite/MarketingPartnerInterestLinks.tsx");
    expect(card).toContain("mapsite-card-talk");
    expect(card).toContain("MARKETING_PARTNER_WHATSAPP_HREF");
    expect(card).not.toContain("Telegram");
  });
});
