import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clampSeoText,
  fillPersonalHomeCopy,
  invalidPersonalHomeButtons,
  isPersonalHomePath,
  normalizePersonalHomeButtons,
  normalizePersonalHomeHref,
  personalHomePath,
  resolvePersonalHome,
} from "../lib/talispros/personal-home";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

const root = process.cwd();

const defaults = {
  imageUrl: "/default.jpg",
  kicker: "Welcome",
  headline: "Jane Doe",
  writeUp: "Default write-up",
  buttons: [{ label: "Open Mapsite", href: "/talispros/mapsite/brokers/xx00" }],
};

describe("personal home helpers", () => {
  it("builds lowercase /talispros/home paths", () => {
    expect(personalHomePath(" AB12 ")).toBe("/talispros/home/ab12");
    expect(isPersonalHomePath("/talispros/home/ab12")).toBe(true);
    expect(isPersonalHomePath("/talispros/mapsite")).toBe(false);
  });

  it("only accepts safe button links", () => {
    expect(normalizePersonalHomeHref("/talisu/engage")).toBe("/talisu/engage");
    expect(normalizePersonalHomeHref("www.example.com")).toBe("https://www.example.com/");
    expect(normalizePersonalHomeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(normalizePersonalHomeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(normalizePersonalHomeHref("javascript:alert(1)")).toBeNull();
    expect(normalizePersonalHomeHref("//evil.example")).toBeNull();
    expect(normalizePersonalHomeHref("")).toBeNull();
  });

  it("drops invalid buttons and reports the bad rows", () => {
    const raw = [
      { label: "Call me", href: "tel:+14165550100" },
      { label: "", href: "" },
      { label: "Bad", href: "javascript:void(0)" },
      { label: "A", href: "/a" },
      { label: "B", href: "/b" },
    ];
    expect(invalidPersonalHomeButtons(raw)).toEqual([2]);
    const buttons = normalizePersonalHomeButtons(raw);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toEqual({ label: "Call me", href: "tel:+14165550100" });
  });

  it("falls back to Mapsite defaults field by field", () => {
    const none = resolvePersonalHome(defaults, null);
    expect(none.headline).toBe("Jane Doe");
    expect(none.buttons).toEqual(defaults.buttons);
    expect(none.customized.headline).toBe(false);

    const some = resolvePersonalHome(defaults, {
      imageUrl: null,
      kicker: null,
      headline: "Custom",
      writeUp: "  ",
      buttons: [],
      updatedAt: null,
    });
    expect(some.headline).toBe("Custom");
    expect(some.writeUp).toBe("Default write-up");
    expect(some.imageUrl).toBe("/default.jpg");
    expect(some.customized.headline).toBe(true);
  });

  it("fills copy templates and clamps SEO text", () => {
    expect(fillPersonalHomeCopy("Hi {name}", { name: "Jane" })).toBe("Hi Jane");
    expect(clampSeoText("x".repeat(200), 70).length).toBeLessThanOrEqual(70);
  });
});

describe("personal home wiring", () => {
  it("has EN + DE copy with the Home / Mapsite navbar labels", () => {
    expect(en.personalHome.navHome).toBe("Home");
    expect(en.personalHome.navMapsite).toBe("Mapsite");
    expect(de.personalHome.navMapsite).toBe("Mapsite");
    expect(de.personalHome.navHome).toBeTruthy();
    expect(en.personalHome.claimMarket).toContain("™");
    expect(en.personalHome.navMapsite).not.toContain("™");
    expect(Object.keys(de.personalHome.edit).sort()).toEqual(
      Object.keys(en.personalHome.edit).sort(),
    );
    expect(de.meta.personalHome.title).toContain("{name}");
  });

  it("routes FAST Code entry and the demo build to the home page first", () => {
    const actions = readFileSync(join(root, "app/talispros/mapsites/actions.ts"), "utf8");
    expect(actions).toContain("personalHomePath(resolvedCode)");
    const demo = readFileSync(join(root, "app/talispros/demo-mapsite/actions.ts"), "utf8");
    expect(demo).toContain("homeHref");
    const client = readFileSync(
      join(root, "components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx"),
      "utf8",
    );
    expect(client).toContain("result.homeHref ||");
    const shortLink = readFileSync(join(root, "app/a/[fastCode]/page.tsx"), "utf8");
    expect(shortLink).toContain("personalHomePath");
  });

  it("keeps edit controls owner-only and adds the Mapsite navbar", () => {
    const page = readFileSync(join(root, "app/talispros/home/[fastCode]/page.tsx"), "utf8");
    expect(page).toContain("AdviserLayout");
    expect(page).toContain("canEdit ?");
    expect(page).toContain("generateMetadata");
    const app = readFileSync(
      join(root, "components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    expect(app).toContain("PersonalHomeNav");
    expect(app).toContain("showOwnerClaimMarket");
    const migration = readFileSync(
      join(root, "supabase/migrations/113_mapsite_personal_home.sql"),
      "utf8",
    );
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
  });
});
