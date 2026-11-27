import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import {
  applyGetOwnMapsiteButton,
  GET_OWN_MAPSITE_FLAG_DEFAULT,
  GET_OWN_MAPSITE_FLAG_ID,
  GET_OWN_MAPSITE_HREF,
  isGetOwnMapsiteButton,
  isGetOwnMapsiteHref,
  parseGetOwnMapsiteFlag,
} from "../lib/talispros/get-own-mapsite";
import type { PersonalHomeButton } from "../lib/talispros/personal-home";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

const openMapsite: PersonalHomeButton = {
  label: "Open Mapsite",
  href: "/map/rm22",
  kind: "link",
};

const rm22Manual: PersonalHomeButton = {
  label: "Get your own Mapsite",
  href: "/home-market",
  kind: "link",
};

describe("Get your own Mapsite flag", () => {
  it("defaults on when the GlobalContent row is missing", () => {
    expect(GET_OWN_MAPSITE_FLAG_DEFAULT).toBe(true);
    expect(parseGetOwnMapsiteFlag(null)).toBe(true);
    expect(parseGetOwnMapsiteFlag(undefined)).toBe(true);
    expect(parseGetOwnMapsiteFlag("")).toBe(true);
    expect(parseGetOwnMapsiteFlag("maybe")).toBe(true);
  });

  it("reads on/off values from GlobalContent.title", () => {
    expect(parseGetOwnMapsiteFlag("on")).toBe(true);
    expect(parseGetOwnMapsiteFlag("ON")).toBe(true);
    expect(parseGetOwnMapsiteFlag("true")).toBe(true);
    expect(parseGetOwnMapsiteFlag("off")).toBe(false);
    expect(parseGetOwnMapsiteFlag(" False ")).toBe(false);
    expect(parseGetOwnMapsiteFlag("0")).toBe(false);
  });
});

describe("Get your own Mapsite button matching", () => {
  it("recognizes relative and absolute Home Market links", () => {
    expect(GET_OWN_MAPSITE_HREF).toBe("/home-market");
    expect(isGetOwnMapsiteHref("/home-market")).toBe(true);
    expect(isGetOwnMapsiteHref("/home-market/")).toBe(true);
    expect(isGetOwnMapsiteHref("/home-market?src=rm22")).toBe(true);
    expect(isGetOwnMapsiteHref("https://www.tsplits.com/home-market")).toBe(true);
    expect(isGetOwnMapsiteHref("https://tsplits.com/home-market/")).toBe(true);
    expect(isGetOwnMapsiteHref("http://localhost:3000/home-market")).toBe(true);
    expect(isGetOwnMapsiteHref("/map/rm22")).toBe(false);
    expect(isGetOwnMapsiteHref("/home")).toBe(false);
  });

  it("matches the English or German label even if the href differs", () => {
    expect(
      isGetOwnMapsiteButton(
        { label: "Get your own Mapsite", href: "/somewhere" },
        [en.personalHome.getOwnMapsite, de.personalHome.getOwnMapsite],
      ),
    ).toBe(true);
    expect(
      isGetOwnMapsiteButton(
        { label: "Holen Sie sich Ihre eigene Mapsite", href: "/map/rm22" },
        [en.personalHome.getOwnMapsite, de.personalHome.getOwnMapsite],
      ),
    ).toBe(true);
    expect(
      isGetOwnMapsiteButton(
        { label: "Open Mapsite", href: "/map/rm22" },
        [en.personalHome.getOwnMapsite],
      ),
    ).toBe(false);
  });
});

describe("RM22 deduplication", () => {
  it("does not add a second button when RM22 already has a custom one", () => {
    const existing = [openMapsite, rm22Manual];
    const merged = applyGetOwnMapsiteButton(existing, {
      enabled: true,
      label: en.personalHome.getOwnMapsite,
    });
    expect(merged).toEqual(existing);
    expect(merged.filter((button) => isGetOwnMapsiteButton(button, [en.personalHome.getOwnMapsite]))).toHaveLength(1);
  });

  it("still treats an absolute tsplits.com link as the same CTA", () => {
    const existing = [
      openMapsite,
      { label: "Get a Mapsite", href: "https://www.tsplits.com/home-market", kind: "link" as const },
    ];
    const merged = applyGetOwnMapsiteButton(existing, {
      enabled: true,
      label: en.personalHome.getOwnMapsite,
    });
    expect(merged).toEqual(existing);
    expect(merged).toHaveLength(2);
  });

  it("appends the platform button when the owner has not added one", () => {
    const merged = applyGetOwnMapsiteButton([openMapsite], {
      enabled: true,
      label: en.personalHome.getOwnMapsite,
    });
    expect(merged).toEqual([
      openMapsite,
      { label: "Get your own Mapsite", href: "/home-market", kind: "link" },
    ]);
  });

  it("hides the RM22 custom button when the Admin flag is off", () => {
    const merged = applyGetOwnMapsiteButton([openMapsite, rm22Manual], {
      enabled: false,
      label: en.personalHome.getOwnMapsite,
    });
    expect(merged).toEqual([openMapsite]);
  });
});

describe("wiring", () => {
  it("stores the flag in existing GlobalContent and shows the toggle on the Admin dashboard", () => {
    expect(GET_OWN_MAPSITE_FLAG_ID).toBe("get_own_mapsite_button");
    const settings = read("lib/talispros/get-own-mapsite-settings.ts");
    expect(settings).toContain('from("GlobalContent")');
    expect(settings).toContain("displayType: \"toggle\"");
    expect(settings).not.toMatch(/from\("talismaps_platform_settings"\)/);
    const dashboard = read("app/admin/dashboard/page.tsx");
    expect(dashboard).toContain("GetOwnMapsiteToggle");
    expect(read("components/admin/GetOwnMapsiteToggle.tsx")).toContain('Show &quot;Get your own Mapsite&quot; button');
    const content = read("app/admin/content/page.tsx");
    expect(content).toContain('!== "toggle"');
  });

  it("injects the white secondary CTA on personal home pages only", () => {
    const page = read("app/home/[fastCode]/page.tsx");
    expect(page).toContain("applyGetOwnMapsiteButton");
    expect(page).toContain("CTA_SECONDARY");
    expect(page).toContain("personal-home-get-own-mapsite");
    expect(page).toContain("getGetOwnMapsiteButtonEnabled");
    expect(read("components/mapsite/MapSiteTopBar.tsx")).not.toContain("applyGetOwnMapsiteButton");
    expect(read("components/mapsite/MapSiteFooter.tsx")).not.toContain("applyGetOwnMapsiteButton");
  });
});
