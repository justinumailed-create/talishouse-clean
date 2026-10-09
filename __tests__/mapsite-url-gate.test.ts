import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { en } from "../lib/i18n/dictionaries/en";
import {
  isMapsiteRegisterPathStandIn,
  isMapsiteUrlGateExempt,
  isUrlGateExpired,
  isUrlGatePinFormat,
  listingResourceHref,
  MAPSITE_DEFAULT_REGISTER_URL,
  MAPSITE_URL_ADDITIONAL_PINS_SENTINEL,
  MAPSITE_URL_GATE_HEADLINE,
  MAPSITE_URL_GATE_SENTINEL,
  MAPSITE_URL_GATE_TTL_LABEL,
  MAPSITE_URL_GATE_TTL_MS,
  MAPSITE_URL_OVERRIDES,
  mapsiteHasGatedUrl,
  mapsiteUrlGateHref,
  mapsiteUrlGatePath,
  normalizeUrlGatePin,
  registerYourMapSiteFastCodeFromPath,
  resolveMapsiteListingUrl,
  resolvePublishedUrlButtonHref,
  urlGateExpiresAt,
} from "@/lib/talispros/mapsite-url-gate";
import {
  generateUrlGatePin,
  hashUrlGatePin,
  urlGatePinsMatch,
} from "@/lib/talispros/mapsite-url-gate-crypto";
import { urlGateCodeFromNotification } from "@/lib/talispros/admin-notifications";

describe("Mapsite URL gate", () => {
  it("keeps gate helpers client-safe and documents TTL", () => {
    expect(MAPSITE_URL_GATE_HEADLINE).toBe("Secure URL access");
    expect(MAPSITE_URL_GATE_TTL_LABEL).toBe("30 minutes");
    expect(MAPSITE_URL_GATE_TTL_MS).toBe(30 * 60 * 1000);
    expect(mapsiteUrlGatePath("AR01")).toBe(
      "/talispros/register-your-mapsite/ar01",
    );
    expect(
      mapsiteUrlGateHref("ar01", "https://talisall.com/mkts-ca/"),
    ).toBe("/talispros/register-your-mapsite/ar01");
    expect(mapsiteUrlGateHref("ar01", "")).toBeNull();
    expect(mapsiteHasGatedUrl("talisall.com/mkts-ca/")).toBe(true);
    expect(mapsiteHasGatedUrl("")).toBe(false);
    expect(listingResourceHref("talisall.com/mkts-ca/")).toBe(
      "https://talisall.com/mkts-ca/",
    );
    expect(
      readFileSync(
        join(process.cwd(), "lib/talispros/mapsite-url-gate.ts"),
        "utf8",
      ),
    ).not.toContain("node:crypto");

    const expires = urlGateExpiresAt(new Date("2026-01-01T00:00:00.000Z"));
    expect(expires.toISOString()).toBe("2026-01-01T00:30:00.000Z");
    expect(
      isUrlGateExpired(
        "2026-01-01T00:00:00.000Z",
        new Date("2026-01-01T00:31:00.000Z"),
      ),
    ).toBe(true);
    expect(
      isUrlGateExpired(
        "2026-01-01T01:00:00.000Z",
        new Date("2026-01-01T00:31:00.000Z"),
      ),
    ).toBe(false);
  });

  it("routes claimed Mapsite URL to Register or multipin Dashboard (no dead-end gate)", () => {
    const popup = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSitePropertyPopup.tsx",
      ),
      "utf8",
    );
    expect(popup).toContain("resolvePublishedUrlButtonHref");
    expect(popup).toContain("canBuyAdditionalPins");
    expect(popup).toContain("onOpenAdditionalPins");
    expect(popup).toContain("MAPSITE_URL_ADDITIONAL_PINS_SENTINEL");
    expect(popup).not.toContain("MapSiteUrlGateDialog");
    expect(popup).not.toContain("MAPSITE_URL_GATE_SENTINEL");
    expect(popup).not.toContain(
      "mapsiteUrlGateHref(site.fast_code, site.broker_url)",
    );

    const app = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSiteApplication.tsx",
      ),
      "utf8",
    );
    expect(app).toContain("canBuyAdditionalPins={dashboardManageable}");
    expect(app).toContain("onOpenAdditionalPins={openOwnerDashboard}");

    // Gate helpers remain for admin tooling; published URL no longer uses them.
    const dialog = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSiteUrlGateDialog.tsx",
      ),
      "utf8",
    );
    expect(dialog).toContain("requestMapSiteUrlGateCode");
    expect(dialog).toContain("unlockMapSiteUrlWithGatePin");
    expect(en.mapsite.urlGate.generate).toBe("Generate secure code");

    const actions = readFileSync(
      join(process.cwd(), "lib/talispros/mapsite-url-gate-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("createAdminNotification");
    expect(actions).toContain('type: "mapsite_url_gate_code"');
    expect(actions).toContain("requestMapSiteUrlGateCode");

    const page = readFileSync(
      join(
        process.cwd(),
        "app/talispros/register-your-mapsite/[fastCode]/page.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("MAPSITE_DEFAULT_REGISTER_URL");
    expect(page).toContain("redirect(");
    expect(page).not.toContain("RegisterYourMapSiteClient");

    const admin = readFileSync(
      join(
        process.cwd(),
        "components/talispros-admin/MapSiteAdminEditor.tsx",
      ),
      "utf8",
    );
    expect(admin).toContain("MapSiteUrlGatePinControls");

    expect(
      registerYourMapSiteFastCodeFromPath(
        "/talispros/register-your-mapsite/AR01",
      ),
    ).toBe("ar01");
    const header = readFileSync(
      join(process.cwd(), "components/talispros/TalisprosHeader.tsx"),
      "utf8",
    );
    // Back to Mapsite removed from the register-your-mapsite header (logo links Home).
    expect(header).not.toContain("Back to Mapsite");
    expect(header).toContain("href={logoHref}");
  });

  it("matches only the 6-digit PIN for that FAST Code and exposes admin notification code", () => {
    expect(normalizeUrlGatePin("12 34-56")).toBe("123456");
    expect(isUrlGatePinFormat("123456")).toBe(true);
    expect(isUrlGatePinFormat("12345")).toBe(false);
    expect(generateUrlGatePin()).toMatch(/^\d{6}$/);
    const hash = hashUrlGatePin("ar01", "123456");
    expect(urlGatePinsMatch("AR01", "123456", hash)).toBe(true);
    expect(urlGatePinsMatch("ar01", "000000", hash)).toBe(false);
    expect(urlGatePinsMatch("rm22", "123456", hash)).toBe(false);

    expect(
      urlGateCodeFromNotification({
        id: "1",
        type: "mapsite_url_gate_code",
        title: "URL secure code · AR01",
        body: "code",
        metadata: { code: "654321", fastCode: "ar01" },
        readAt: null,
        createdAt: new Date().toISOString(),
      }),
    ).toBe("654321");
    expect(
      urlGateCodeFromNotification({
        id: "2",
        type: "other",
        title: "x",
        body: "y",
        metadata: { code: "654321" },
        readAt: null,
        createdAt: new Date().toISOString(),
      }),
    ).toBeNull();
  });

  it("exempts DC01 and DC02 from the URL gate and forces Aisha's /talisu/reg Register page (same tab)", () => {
    expect(isMapsiteUrlGateExempt("DC01")).toBe(true);
    expect(isMapsiteUrlGateExempt("dc01")).toBe(true);
    expect(isMapsiteUrlGateExempt("Dc01")).toBe(true);
    expect(isMapsiteUrlGateExempt("DC02")).toBe(true);
    expect(isMapsiteUrlGateExempt("dc02")).toBe(true);
    expect(isMapsiteUrlGateExempt("Dc02")).toBe(true);
    expect(isMapsiteUrlGateExempt("ar01")).toBe(false);
    expect(MAPSITE_URL_OVERRIDES.dc01).toBe(
      "/talisu/reg",
    );
    expect(MAPSITE_URL_OVERRIDES.dc02).toBe(
      "/talisu/reg",
    );
    expect(
      resolveMapsiteListingUrl("DC01", "https://www.talispros.com/talisu/reg"),
    ).toBe("/talisu/reg");
    expect(
      resolveMapsiteListingUrl("DC02", "https://www.talispros.com/talisu/reg"),
    ).toBe("/talisu/reg");
    expect(
      resolvePublishedUrlButtonHref(
        "dc01",
        "https://www.talispros.com/talisu/reg",
      ),
    ).toBe("/talisu/reg");
    expect(
      resolvePublishedUrlButtonHref(
        "dc02",
        "https://www.talispros.com/talisu/reg",
      ),
    ).toBe("/talisu/reg");
    expect(
      mapsiteUrlGateHref("DC01", "https://example.com/old"),
    ).toBe("/talisu/reg");
    expect(
      mapsiteUrlGateHref("DC02", "https://example.com/old"),
    ).toBe("/talisu/reg");
    expect(
      resolvePublishedUrlButtonHref("ar01", "https://example.com/paid"),
    ).toBe(MAPSITE_DEFAULT_REGISTER_URL);
    expect(
      resolvePublishedUrlButtonHref(
        "ar01",
        "/talispros/register-your-mapsite/ar01",
      ),
    ).toBe(MAPSITE_DEFAULT_REGISTER_URL);
    expect(
      resolvePublishedUrlButtonHref("dc04", null),
    ).toBe(MAPSITE_DEFAULT_REGISTER_URL);
    expect(
      resolvePublishedUrlButtonHref("rm22", "https://example.com/paid", {
        canBuyAdditionalPins: true,
      }),
    ).toBe(MAPSITE_URL_ADDITIONAL_PINS_SENTINEL);
    expect(MAPSITE_URL_GATE_SENTINEL).toBe("__url_gate__");
    expect(mapsiteHasGatedUrl("", "dc01")).toBe(true);
    expect(mapsiteHasGatedUrl("", "dc02")).toBe(true);

    const actions = readFileSync(
      join(process.cwd(), "lib/talispros/mapsite-url-gate-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("isMapsiteUrlGateExempt");
    expect(actions).toContain("resolveMapsiteListingUrl");

    const controls = readFileSync(
      join(
        process.cwd(),
        "components/talispros-admin/MapSiteUrlGatePinControls.tsx",
      ),
      "utf8",
    );
    expect(controls).toContain("isMapsiteUrlGateExempt");
  });


  it("treats register-your-mapsite paths (and homepage) as payment stand-ins", () => {
    expect(
      isMapsiteRegisterPathStandIn("/talispros/register-your-mapsite/ar01"),
    ).toBe(true);
    expect(isMapsiteRegisterPathStandIn("/")).toBe(true);
    expect(isMapsiteRegisterPathStandIn("https://example.com/paid")).toBe(
      false,
    );
    expect(
      isMapsiteRegisterPathStandIn(
        "https://talispros.mysamcart.com/checkout/register",
      ),
    ).toBe(false);

    const actions = readFileSync(
      join(process.cwd(), "lib/talispros/mapsite-url-gate-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("isMapsiteRegisterPathStandIn");
    expect(actions).toContain("buildClaimedMapSitePath");
    expect(actions).toContain("resolveUrlGateUnlockHref");
  });

  it("ships codes to the Admin Notifications tab", () => {
    const nav = readFileSync(join(process.cwd(), "lib/admin-nav.ts"), "utf8");
    expect(nav).toContain("/admin/notifications");
    expect(nav).toContain("Notifications");

    const page = readFileSync(
      join(process.cwd(), "app/admin/notifications/page.tsx"),
      "utf8",
    );
    expect(page).toContain("listAdminNotifications");
    expect(page).toContain("AdminNotificationsPanel");

    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/090_mapsite_url_gate_notifications.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("admin_notifications");
    expect(migration).toContain("expires_at");
    expect(migration).toContain("consumed_at");
  });
});
