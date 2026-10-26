import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  isTalisUEngageCheckoutStep,
  isTalisURegisterCheckoutStep,
  talisUEngageCheckoutHref,
  talisURegisterCheckoutHref,
} from "../lib/talisu/ask-step";
import {
  MAPSITE_DEFAULT_REGISTER_URL,
  resolvePublishedUrlButtonHref,
} from "../lib/talispros/mapsite-url-gate";

describe("Ralf batch 2 — demo → registration", () => {
  it("shows the exact Home Pin name hint on the demo build page (EN + DE)", () => {
    expect(en.demo.homePinNameHint).toBe(
      "(or where you would like to centre your home market)",
    );
    expect(en.demo.listingTitle).toBe("Demo Mapsite");
    expect(en.demo.defaultListingTitle).toBe("Home PIN Address");
    expect(de.demo.homePinNameHint.startsWith("(oder ")).toBe(true);
    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).toContain("d.homePinNameHint");
  });

  it("sends the Mapsite URL flag + gate to /talisu/reg (same tab), not SamCart", () => {
    expect(MAPSITE_DEFAULT_REGISTER_URL).toBe("/talisu/reg");
    expect(resolvePublishedUrlButtonHref("demo-abc12345", null)).toBe("/talisu/reg");
    expect(resolvePublishedUrlButtonHref("dc01", null)).toBe("/talisu/reg");
    const gate = readFileSync(
      resolve("app/talispros/register-your-mapsite/[fastCode]/page.tsx"),
      "utf8",
    );
    expect(gate).toContain("MAPSITE_DEFAULT_REGISTER_URL");
    expect(gate).not.toContain("mysamcart");
  });

  it("asks for the business before Register and Engage checkouts (Proceed, no auto-redirect)", () => {
    expect(isTalisURegisterCheckoutStep(undefined)).toBe(false);
    expect(isTalisURegisterCheckoutStep("register")).toBe(true);
    expect(isTalisUEngageCheckoutStep(["pay"])).toBe(true);
    expect(talisURegisterCheckoutHref()).toBe("/talisu/reg?step=register");
    expect(talisUEngageCheckoutHref("P07")).toBe("/talisu/engage?step=pay&product=P07");
    expect(talisUEngageCheckoutHref(null)).toBe("/talisu/engage?step=pay");

    // Ralf 3: no "select URL in the flag / Proceed" box on Aisha's page.
    expect("askLine" in en.talisu.register).toBe(false);
    expect("askLine" in de.talisu.register).toBe(false);
    expect(en.talisu.register.ctaLabel).toBe("Register now");
    expect(de.talisu.register.ctaLabel).not.toBe(en.talisu.register.ctaLabel);
    expect(en.talisu.engage.ctaNote).not.toMatch(/\$|USD/);
    expect(de.talisu.engage.ctaNote).not.toMatch(/\$|USD/);

    for (const file of ["app/talisu/reg/page.tsx", "app/talisu/engage/page.tsx"]) {
      const page = readFileSync(resolve(file), "utf8");
      expect(page).toContain("AdviserLayout");
      expect(page).not.toMatch(/window\.location|setTimeout/);
      // Only redirects allowed: the PMC gate back to the TalisU sequence
      // (unsigned Service Agreement), and the Engage lock bouncing step=pay
      // back to the landing — never an auto-redirect to checkout.
      const redirects = page.match(/redirect\([^;]*\)/g) ?? [];
      for (const r of redirects) {
        expect(r).toMatch(/PMC_PATHS\.talispros|^redirect\(engageLockedHref\(/);
      }
    }
  });
});

describe("Ralf follow-ups — blue navbar Register + Webster CAD", () => {
  it("keeps every blue navbar Register entry on /talisu/reg (same tab)", async () => {
    const pins = await import("../lib/talisu/markets-pins");
    const register = pins.TALISU_MKTS_HEADER_NAV.find((i) => i.label === "Register");
    expect(register?.href).toBe("/talisu/reg");
    const dropdown = pins.TALISU_MKTS_HEADER_REGISTER_DROPDOWN;
    expect(dropdown.find((i) => i.label === "Mapsite")?.href).toBe("/talisu/reg");
    expect(dropdown.find((i) => i.label === "Product Options")?.href).toBe("/talisu/engage");
    for (const item of [...pins.TALISU_MKTS_HEADER_NAV, ...dropdown]) {
      expect(item.href).not.toContain("mysamcart");
    }
  });

  it("labels Webster's down payment in CAD (EN + DE), amount unchanged", () => {
    expect(en.talisu.engage.helpItems[0]).toBe(
      "Select a design and send a $2,000 CAD Down Payment.",
    );
    expect(de.talisu.engage.helpItems[0]).toContain("2.000 CAD");
    expect(de.talisu.engage.helpItems[0]).not.toContain("$");
  });
});
