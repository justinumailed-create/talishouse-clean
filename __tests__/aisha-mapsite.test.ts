import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import {
  fastCodeEntryHref,
  mapsiteShowsAisha,
} from "../lib/talispros/aisha-mapsites";
import { mapsiteDashboardViewEnabled } from "../lib/talispros/mapsite-dashboard-view";
import { HIDDEN_PARTNERS_ON_PAGE } from "../lib/talispros/mapsite-root-partners-service";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha on an allowlisted Mapsite", () => {
  it("turns the widget on for DC06 only", () => {
    expect(mapsiteShowsAisha("DC06")).toBe(true);
    expect(mapsiteShowsAisha(" dc06 ")).toBe(true);
    expect(mapsiteShowsAisha("dc05")).toBe(false);
    expect(mapsiteShowsAisha("")).toBe(false);
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("mapsiteShowsAisha(mapsite.fast_code)");
    expect(app).toContain('invitation="callback"');
    expect(app).toContain('placement="bottom-right"');
    expect(app).toContain("agentId={AISHA_MAPSITE_AGENT_ID}");
  });

  it("uses the call-back invitation in English and German", () => {
    expect(en.home.assistants.aisha.callback).toBe(
      "Propose a Project. Just start a call and tell me what you can see for here.",
    );
    expect(de.home.assistants.aisha.callback).toBe(
      "Schlagen Sie ein Projekt vor. Starten Sie einfach einen Anruf und erzählen Sie mir, was Sie hier sehen.",
    );
    expect(en.mapsite.leftCard.inventory).toBe("I represent this Inventory");
    expect(de.mapsite.leftCard.inventory).toBe("Ich vertrete dieses Inventar");
    expect(en.home.assistants.aisha.greeting).not.toBe(en.home.assistants.aisha.callback);
  });

  it("sends DC06 from the FAST Code gate to the claimed Mapsite", () => {
    expect(fastCodeEntryHref({ fastCode: "DC06", accountType: "listings" })).toBe(
      "/talispros/mapsite/brokers/dc06",
    );
    expect(fastCodeEntryHref({ fastCode: "rm22", accountType: "brokers" })).toBe(
      "/talispros/home/rm22",
    );
    const actions = read("app/talispros/mapsites/actions.ts");
    expect(actions).toContain("fastCodeEntryHref");
    expect(actions).toContain("personalHomePath(resolvedCode)");
  });

  it("keeps the dashboard view on unless an admin turns it off", () => {
    expect(mapsiteDashboardViewEnabled(undefined)).toBe(true);
    expect(mapsiteDashboardViewEnabled(true)).toBe(true);
    expect(mapsiteDashboardViewEnabled(false)).toBe(false);
    expect(HIDDEN_PARTNERS_ON_PAGE.dc06).toEqual(["dc05"]);
    expect(HIDDEN_PARTNERS_ON_PAGE.dc05).toBeUndefined();
    expect(read("components/talispros/mapsite/MapSiteApplication.tsx")).toContain(
      "setSelectedPinId(mapsite.id)",
    );
    expect(read("app/admin/mapsites/[fastCode]/page.tsx")).toContain(
      "MapSiteDashboardViewToggle",
    );
  });
});
