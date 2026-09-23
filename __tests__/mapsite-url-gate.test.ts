import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  listingResourceHref,
  MAPSITE_URL_GATE_HEADLINE,
  mapsiteUrlGateHref,
  mapsiteUrlGatePath,
  normalizeUrlGatePin,
  registerYourMapSiteFastCodeFromPath,
} from "@/lib/talispros/mapsite-url-gate";
import { hashUrlGatePin, urlGatePinsMatch } from "@/lib/talispros/mapsite-url-gate-crypto";

describe("Mapsite™ URL gate", () => {
  it("sends the pin URL button through Register YOUR Mapsite™", () => {
    expect(MAPSITE_URL_GATE_HEADLINE).toBe("Register YOUR Mapsite™");
    expect(mapsiteUrlGatePath("AR01")).toBe(
      "/talispros/register-your-mapsite/ar01",
    );
    expect(
      mapsiteUrlGateHref("ar01", "https://talisall.com/mkts-ca/"),
    ).toBe("/talispros/register-your-mapsite/ar01");
    expect(mapsiteUrlGateHref("ar01", "")).toBeNull();
    expect(listingResourceHref("talisall.com/mkts-ca/")).toBe(
      "https://talisall.com/mkts-ca/",
    );

    const popup = readFileSync(
      join(process.cwd(), "components/talispros/mapsite/MapSitePropertyPopup.tsx"),
      "utf8",
    );
    expect(popup).toContain("mapsiteUrlGateHref(site.fast_code, site.broker_url)");
    expect(popup).not.toContain("listingResourceHref(site.broker_url)");

    const page = readFileSync(
      join(
        process.cwd(),
        "app/talispros/register-your-mapsite/[fastCode]/page.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("MAPSITE_URL_GATE_HEADLINE");
    expect(page).toContain("RegisterYourMapSiteClient");

    const admin = readFileSync(
      join(
        process.cwd(),
        "components/talispros-admin/MapSiteAdminEditor.tsx",
      ),
      "utf8",
    );
    expect(admin).toContain("MapSiteUrlGatePinControls");

    expect(registerYourMapSiteFastCodeFromPath("/talispros/register-your-mapsite/AR01")).toBe(
      "ar01",
    );
    const header = readFileSync(
      join(process.cwd(), "components/talispros/TalisprosHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("Back to Mapsite™");
    expect(header).toContain("registerYourMapSiteFastCodeFromPath");
    expect(header).toContain("buildClaimedMapSitePath");
    expect(readFileSync(join(process.cwd(), "lib/talispros/mapsite-url-gate.ts"), "utf8")).not.toContain("node:crypto");
  });

  it("matches only the Admin-issued 6-digit PIN for that FAST Code", () => {
    expect(normalizeUrlGatePin("12 34-56")).toBe("123456");
    const hash = hashUrlGatePin("ar01", "123456");
    expect(urlGatePinsMatch("AR01", "123456", hash)).toBe(true);
    expect(urlGatePinsMatch("ar01", "000000", hash)).toBe(false);
    expect(urlGatePinsMatch("rm22", "123456", hash)).toBe(false);
  });
});
