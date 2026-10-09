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
      "(, or change to what you would like your Home Pin to be named)",
    );
    expect(de.demo.homePinNameHint.startsWith("(, ")).toBe(true);
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

    expect(en.talisu.register.askLine).toBe(
      "Please select 'URL' in the flag to register your market.",
    );
    expect(en.talisu.register.askProceed).toBe("Proceed");
    expect(en.talisu.engage.askProceed).toBe("Proceed");
    expect(de.talisu.register.askLine).toContain("URL");
    expect(en.talisu.engage.askLine).not.toMatch(/\$|USD/);
    expect(de.talisu.engage.askLine).not.toMatch(/\$|USD/);

    for (const file of ["app/talisu/reg/page.tsx", "app/talisu/engage/page.tsx"]) {
      const page = readFileSync(resolve(file), "utf8");
      expect(page).toContain("PartnerAskStep");
      expect(page).not.toMatch(/redirect\(|window\.location|setTimeout/);
    }
  });
});
