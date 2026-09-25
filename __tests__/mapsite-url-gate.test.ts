import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isUrlGateExpired,
  isUrlGatePinFormat,
  listingResourceHref,
  MAPSITE_URL_GATE_HEADLINE,
  MAPSITE_URL_GATE_TTL_LABEL,
  MAPSITE_URL_GATE_TTL_MS,
  mapsiteHasGatedUrl,
  mapsiteUrlGateHref,
  mapsiteUrlGatePath,
  normalizeUrlGatePin,
  registerYourMapSiteFastCodeFromPath,
  urlGateExpiresAt,
} from "@/lib/talispros/mapsite-url-gate";
import {
  generateUrlGatePin,
  hashUrlGatePin,
  urlGatePinsMatch,
} from "@/lib/talispros/mapsite-url-gate-crypto";
import { urlGateCodeFromNotification } from "@/lib/talispros/admin-notifications";

describe("Mapsite™ URL gate", () => {
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

  it("opens a secure-code popup from the published Mapsite™ URL button", () => {
    const popup = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSitePropertyPopup.tsx",
      ),
      "utf8",
    );
    expect(popup).toContain("MapSiteUrlGateDialog");
    expect(popup).toContain("mapsiteHasGatedUrl(site.broker_url)");
    expect(popup).not.toContain(
      "mapsiteUrlGateHref(site.fast_code, site.broker_url)",
    );
    expect(popup).toContain("__url_gate__");

    const dialog = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSiteUrlGateDialog.tsx",
      ),
      "utf8",
    );
    expect(dialog).toContain("requestMapSiteUrlGateCode");
    expect(dialog).toContain("unlockMapSiteUrlWithGatePin");
    expect(dialog).toContain("Generate secure code");
    expect(dialog).toContain("window.open");

    const actions = readFileSync(
      join(process.cwd(), "lib/talispros/mapsite-url-gate-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("createAdminNotification");
    expect(actions).toContain('type: "mapsite_url_gate_code"');
    expect(actions).toContain("consumed_at");
    expect(actions).toContain("expires_at");
    expect(actions).toContain("requestMapSiteUrlGateCode");
    // Visitor generate must not return the plaintext PIN (admin reads it in Notifications).
    const visitorFn = actions.slice(
      actions.indexOf("export async function requestMapSiteUrlGateCode"),
      actions.indexOf("export async function issueMapSiteUrlGatePin"),
    );
    expect(visitorFn).toContain("ttlLabel");
    expect(visitorFn).not.toMatch(/\bpin\s*:/);
    expect(visitorFn).not.toMatch(/\bpin\b\s*[,}]/);

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

    expect(
      registerYourMapSiteFastCodeFromPath(
        "/talispros/register-your-mapsite/AR01",
      ),
    ).toBe("ar01");
    const header = readFileSync(
      join(process.cwd(), "components/talispros/TalisprosHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("Back to Mapsite™");
    expect(header).toContain("registerYourMapSiteFastCodeFromPath");
    expect(header).toContain("buildClaimedMapSitePath");
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
