import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import {
  MAPSITE_ADVANCED_DASHBOARD_SECTIONS,
  MAPSITE_CORE_DASHBOARD_SECTIONS,
  SHOW_ADVANCED_MAPSITE_TABS,
  isMapSiteDashboardSectionVisible,
  resolveMapSiteDashboardSection,
  visibleMapSiteDashboardSections,
} from "@/lib/talispros/mapsite-dashboard-tabs";
import {
  FORM_DRAFT_TTL_MS,
  clearFormDraft,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
  type FormDraftStorage,
} from "@/lib/talispros/form-drafts";
import { isExternalPersonalHomeHref } from "@/lib/talispros/personal-home";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function memoryStorage(): FormDraftStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("Mapsite Dashboard tabs (Ralf, Nov 26)", () => {
  it("shows only PIN Dashboard, Listing links and Logo & Card Editor until the first 20 subscribers", () => {
    expect(SHOW_ADVANCED_MAPSITE_TABS).toBe(false);
    expect(visibleMapSiteDashboardSections()).toEqual(["pins", "links", "branding"]);
    expect([...MAPSITE_CORE_DASHBOARD_SECTIONS]).toEqual(["pins", "links", "branding"]);
    for (const hidden of ["ebooks", "bookshelf", "categories", "partners"] as const) {
      expect(isMapSiteDashboardSectionVisible(hidden)).toBe(false);
      expect(MAPSITE_ADVANCED_DASHBOARD_SECTIONS).toContain(hidden);
    }
  });

  it("re-enables every advanced tab with one flag", () => {
    expect(visibleMapSiteDashboardSections(true)).toEqual([
      "pins",
      "links",
      "branding",
      "ebooks",
      "bookshelf",
      "categories",
      "partners",
    ]);
  });

  it("never lands on a hidden or unknown tab", () => {
    expect(resolveMapSiteDashboardSection("categories")).toBe("pins");
    expect(resolveMapSiteDashboardSection("partners")).toBe("pins");
    expect(resolveMapSiteDashboardSection("ebooks")).toBe("pins");
    expect(resolveMapSiteDashboardSection("bookshelf")).toBe("pins");
    expect(resolveMapSiteDashboardSection("nonsense")).toBe("pins");
    expect(resolveMapSiteDashboardSection(null)).toBe("pins");
    expect(resolveMapSiteDashboardSection("1")).toBe("pins");
    expect(resolveMapSiteDashboardSection("links")).toBe("links");
    expect(resolveMapSiteDashboardSection("branding")).toBe("branding");
    expect(resolveMapSiteDashboardSection("categories", true)).toBe("categories");
  });

  it("keeps the advanced tools in code (hidden, not deleted) and filters the tab bar", () => {
    const page = read("components/talispros/mapsite/MapSiteOwnerDashboard.tsx");
    expect(page).toContain("visibleMapSiteDashboardTabs().map");
    expect(page).not.toContain("MAPSITE_DASHBOARD_SECTIONS.map(");
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    for (const tool of ["MapSiteEbookEditorPanel", "MapSiteBookshelfEditor", "MapSiteCategoryEditor", "MapSitePartnerPanel"]) {
      expect(app).toContain(tool);
    }
    expect(app).toContain("resolveMapSiteDashboardSection(requested)");
    const links = read("components/talispros/mapsite/MapSiteListingLinksEditor.tsx");
    expect(links).toContain('isMapSiteDashboardSectionVisible("ebooks")');
    expect(links).toContain('isMapSiteDashboardSectionVisible("bookshelf")');
    expect(en.mapsite.dashboardPage.linksIntro).not.toContain("Ebook Editor");
    expect(en.mapsite.dashboardPage.intro).not.toContain("partners");
  });
});

describe("Bottom Add Pin replaces the top Dashboard button", () => {
  it("drops the Dashboard button from the Mapsite navbar", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    const navStart = app.indexOf("<PersonalHomeNav");
    const navEnd = app.indexOf("/>", navStart);
    const navProps = app.slice(navStart, navEnd);
    expect(navProps).not.toContain("dashboard={");
    expect(navProps).toContain("logout={ownerLogout}");
  });

  it("puts Add Pin next to Talk to us at the bottom of the Mapsite card", () => {
    const links = read("components/talispros/mapsite/MarketingPartnerInterestLinks.tsx");
    expect(links).toContain('data-testid="mapsite-card-add-pin"');
    expect(links).toContain('data-testid="mapsite-card-talk"');
    expect(links.indexOf("mapsite-card-add-pin")).toBeLessThan(links.indexOf("mapsite-card-talk"));
    expect(links).toContain("onAddPin()");
    const card = read("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx");
    expect(card.match(/onAddPin=\{onAddPin\}/g)?.length).toBe(2);
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("onAddPin={canManageDashboard ? openOwnerDashboard : undefined}");
    expect(app).toContain("addPinLocked={canManageDashboard ? !dashboardManageable : false}");
    expect(en.mapsite.leftCard.addPin).toBe("Add Pin");
    expect(de.mapsite.leftCard.addPin).toBeTruthy();
  });
});

describe("Mapsite Logout", () => {
  it("shows a Logout button in the navbar and dashboard header for owners", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("const ownerLogout = isOwner ? (");
    expect(app).toContain("<MapSiteOwnerLogoutButton");
    expect(app).toContain("headerActions={ownerLogout}");
    expect(app).toContain("footerActions={!personalHomeNav ? ownerLogout : null}");
    const nav = read("components/talispros/personal-home/PersonalHomeNav.tsx");
    expect(nav).toContain('data-testid="personal-home-nav-logout"');
    const dash = read("components/talispros/mapsite/MapSiteOwnerDashboard.tsx");
    expect(dash).toContain('data-testid="mapsite-dashboard-header-actions"');
  });

  it("wires the button to the existing owner logout action", () => {
    const button = read("components/talispros/mapsite/MapSiteOwnerLogoutButton.tsx");
    expect(button).toContain("logoutMapSiteOwnerSession");
    expect(button).toContain("window.location.assign(result.href)");
    expect(en.mapsite.logout).toBe("Logout");
  });
});

describe("Add Pin step-by-step flow", () => {
  const panel = read("components/talispros/mapsite/MapSitePinDashboard.tsx");

  it("renders four colored, numbered steps with a progress bar", () => {
    expect(panel).toContain('data-testid="pin-stepper"');
    expect(panel).toContain("PIN_STEP_NUMBERS.map");
    for (const step of [1, 2, 3, 4]) {
      expect(panel).toContain(`step={${step}}`);
    }
    for (const color of ["bg-[#046BD9]", "bg-amber-500", "bg-violet-600", "bg-emerald-600"]) {
      expect(panel).toContain(color);
    }
    expect(en.mapsite.pinDashboard.step1Title).toBe("Find the address");
    expect(en.mapsite.pinDashboard.step2Title).toBe("Place and fix on the map");
    expect(en.mapsite.pinDashboard.step3Title).toBe("Name and category");
    expect(en.mapsite.pinDashboard.step4Title).toBe("Review your PINs");
    for (const key of ["step1Title", "step2Title", "step3Title", "step4Title", "startOver", "draftRestored"] as const) {
      expect(de.mapsite.pinDashboard[key]).toBeTruthy();
    }
  });

  it("keeps search first, coordinates behind Advanced, and buying PINs in CAD", () => {
    expect(panel.indexOf("<MapSitePlaceSearch")).toBeLessThan(panel.indexOf("step={2}"));
    expect(panel).toMatch(/<details[\s\S]*d\.advancedCoords[\s\S]*d\.placeAtCoords[\s\S]*<\/details>/);
    expect(panel).toContain('id="additional-pins"');
    expect(panel).toContain('product="listpin"');
  });

  it("persists the in-progress draft per Mapsite and clears it on save or Start over", () => {
    expect(panel).toContain("formDraftKey(MAPSITE_PIN_DRAFT_SCOPE, mapsiteId || fastCode)");
    expect(panel).toContain("readFormDraft<PinDraft>(draftKey)");
    expect(panel).toContain("writeFormDraft(draftKey, draft)");
    expect(panel).toMatch(/function saveLabel[\s\S]*clearFormDraft\(draftKey\)/);
    expect(panel).toMatch(/function startOver\(\)[\s\S]*clearFormDraft\(draftKey\)/);
    expect(panel).toContain('data-testid="pin-draft-start-over"');
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("clearFormDraft(formDraftKey(MAPSITE_PIN_DRAFT_SCOPE, draftId))");
  });

  it("has no em dashes in the visible PIN Dashboard and Add Pin copy", () => {
    for (const dict of [en, de]) {
      for (const value of Object.values(dict.mapsite.pinDashboard)) {
        expect(String(value)).not.toContain("—");
      }
      expect(dict.mapsite.leftCard.addPin).not.toContain("—");
      expect(dict.mapsite.dashboardPage.intro).not.toContain("—");
    }
  });
});

describe("form drafts (resume work across tabs)", () => {
  it("writes, reads and clears a draft keyed by scope and listing", () => {
    const storage = memoryStorage();
    const key = formDraftKey("mapsite-pin", "DC06");
    expect(key).toBe("tsplits:draft:mapsite-pin:dc06");
    expect(formDraftKey("mapsite-pin", "RM22")).not.toBe(key);
    writeFormDraft(key, { label: "342 Eskasoni Road", latitude: "46.1" }, storage, 1000);
    expect(readFormDraft(key, storage, 2000)).toEqual({ label: "342 Eskasoni Road", latitude: "46.1" });
    clearFormDraft(key, storage);
    expect(readFormDraft(key, storage, 2000)).toBeNull();
  });

  it("removes empty and expired drafts", () => {
    const storage = memoryStorage();
    const key = formDraftKey("mapsite-links", "dc06");
    writeFormDraft(key, { listingUrl: "https://example.com" }, storage, 0);
    writeFormDraft(key, { listingUrl: "" }, storage, 10);
    expect(storage.data.has(key)).toBe(false);
    writeFormDraft(key, { listingUrl: "https://example.com" }, storage, 0);
    expect(readFormDraft(key, storage, FORM_DRAFT_TTL_MS + 1)).toBeNull();
    expect(storage.data.has(key)).toBe(false);
  });

  it("ignores corrupt storage and missing storage", () => {
    const storage = memoryStorage();
    storage.setItem("tsplits:draft:x:y", "{not json");
    expect(readFormDraft("tsplits:draft:x:y", storage)).toBeNull();
    expect(readFormDraft("tsplits:draft:x:y", null)).toBeNull();
    expect(() => writeFormDraft("k", { a: "b" }, null)).not.toThrow();
  });

  it("keeps the listing URL draft in the Listing links editor", () => {
    const links = read("components/talispros/mapsite/MapSiteListingLinksEditor.tsx");
    expect(links).toContain("formDraftKey(MAPSITE_LINKS_DRAFT_SCOPE, mapsiteId || fastCode)");
    expect(links).toMatch(/save\(\)[\s\S]*clearFormDraft\(draftKey\)/);
  });
});

describe("Open Mapsite never spawns a new window", () => {
  it("opens Tsplits™ links from the personal home page in the same tab", () => {
    expect(isExternalPersonalHomeHref("/mapsite/dc06")).toBe(false);
    expect(isExternalPersonalHomeHref("https://tsplits.com/mapsite/dc06")).toBe(false);
    expect(isExternalPersonalHomeHref("https://www.tsplits.com/home/dc06")).toBe(false);
    expect(isExternalPersonalHomeHref("https://www.realtor.ca/listing/1")).toBe(true);
  });

  it("uses same-tab navigation for Open Mapsite and Place PINs in the Associate Portal", () => {
    const lead = read("components/admin/agents/LeadCrmClient.tsx");
    const openMapsite = lead.slice(lead.indexOf('data-testid="associate-open-mapsite"') - 60, lead.indexOf("{ui.mapsite}"));
    expect(openMapsite).not.toContain("_blank");
    const cards = read("components/admin/agents/AgentFastCodeCards.tsx");
    expect(cards).not.toContain('href={card.mapsiteHref} target="_blank"');
    const work = read("components/admin/agents/AgentWorkPanel.tsx");
    expect(work).not.toContain("window.open(");
    expect(work).toContain("router.push(`/mapsite/${slug(code)}`)");
  });

  it("has no window.open popups in the owner Mapsite dashboard tools", () => {
    for (const file of [
      "components/talispros/mapsite/MapSiteApplication.tsx",
      "components/talispros/mapsite/MapSiteOwnerDashboard.tsx",
      "components/talispros/mapsite/MapSitePinDashboard.tsx",
      "components/talispros/mapsite/MapSiteListingLinksEditor.tsx",
      "components/talispros/personal-home/PersonalHomeNav.tsx",
    ]) {
      expect(read(file)).not.toContain("window.open(");
    }
  });
});
