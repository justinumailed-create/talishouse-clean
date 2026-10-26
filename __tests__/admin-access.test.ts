import { isRetiredAdminFastCode } from "../lib/admin-retired-codes";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ACCOUNTS,
  ADMIN_GRANT_PERMISSIONS,
  FORMER_SUPERADMIN_PERMISSIONS,
  GLOBAL_ADMIN_FAST_CODE,
  accountHasAdminScope,
  adminAccessLabel,
  getAdminAccountByEmail,
  getAdminAccountByFastCode,
  grantToAdminAccount,
  isAuthorizedAdminFastCode,
  isGlobalAdmin,
  sanitizeGrantPermissions,
  scopesForGrantPermissions,
} from "../lib/admin-constants";
import { accountCanAccessAdminPath, getRequiredAdminScopeForPath } from "../lib/admin-route-access";
import { getAdminNavItems, isAdminNavItemActive } from "../lib/admin-nav";
import { isGrantableAdminFastCode } from "../lib/admin-access-grants";

const ralf = grantToAdminAccount({
  fastCode: "rm22",
  displayName: "Ralf",
  permissions: [...FORMER_SUPERADMIN_PERMISSIONS],
});

describe("Global Admin (single)", () => {
  it("ARUN is the one Global Admin with every power", () => {
    const arun = getAdminAccountByFastCode("arun");
    expect(GLOBAL_ADMIN_FAST_CODE).toBe("ARUN");
    expect(arun?.access).toBe("global");
    expect(isGlobalAdmin(arun)).toBe(true);
    expect(getAdminAccountByEmail("arun@kyptronix.com")?.fastCode).toBe("ARUN");
    for (const scope of ["agents", "fast-codes", "partner-linking", "admin-access", "payments", "full-console"] as const) {
      expect(accountHasAdminScope(arun, scope)).toBe(true);
    }
    expect(adminAccessLabel(arun)).toBe("Global Admin");
    expect(ADMIN_ACCOUNTS.map((a) => a.fastCode)).toEqual(["ARUN"]);
  });

  it("retires ADMIN123 and drops the hardcoded RM22 superadmin", () => {
    expect(getAdminAccountByFastCode("ADMIN123")).toBeNull();
    expect(isAuthorizedAdminFastCode("ADMIN123")).toBe(false);
    expect(isRetiredAdminFastCode("admin123")).toBe(true);
    expect(getAdminAccountByFastCode("RM22")).toBeNull();
    expect(isGrantableAdminFastCode("ADMIN123")).toBe(false);
    expect(isGrantableAdminFastCode("ARUN")).toBe(false);
    expect(isGrantableAdminFastCode("rm22")).toBe(true);
    const constants = readFileSync(resolve("lib/admin-constants.ts"), "utf8");
    expect(constants).not.toMatch(/"superadmin"|"full"|"site-ops"/);
  });
});

describe("admin access grants", () => {
  it("only accepts known permissions and never 'grant others'", () => {
    expect(sanitizeGrantPermissions(["seo", "admin-access", "bogus", "seo", "agents"])).toEqual(["seo", "agents"]);
    expect(ADMIN_GRANT_PERMISSIONS).not.toContain("admin-access" as never);
    expect(scopesForGrantPermissions(["seo"])).toEqual(["dashboard", "seo"]);
  });

  it("migrates Ralf (RM22) with his former superadmin powers, not admin access", () => {
    expect(ralf.access).toBe("granted");
    expect(ralf.fastCode).toBe("RM22");
    for (const scope of ["fast-codes", "agents", "mapsites", "talisbooks", "partner-linking", "pmc-pins", "seo", "build-requests"] as const) {
      expect(accountHasAdminScope(ralf, scope)).toBe(true);
    }
    expect(accountHasAdminScope(ralf, "admin-access")).toBe(false);
    expect(accountHasAdminScope(ralf, "payments")).toBe(false);
    expect(accountHasAdminScope(ralf, "full-console")).toBe(false);
    expect(adminAccessLabel(ralf)).toBe("Admin");
    const sql = readFileSync(resolve("supabase/migrations/104_admin_access_grants.sql"), "utf8");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("'RM22'");
    for (const p of FORMER_SUPERADMIN_PERMISSIONS) expect(sql).toContain(`'${p}'`);
  });
});

describe("admin nav + routes follow scopes", () => {
  it("shows Global Admin every section incl. Admin access", () => {
    const hrefs = getAdminNavItems(getAdminAccountByFastCode("ARUN")).map((i) => i.href);
    for (const h of ["/admin/mapsites", "/admin/fast-codes", "/admin/agents", "/admin/access", "/admin/payments", "/admin/registrations"]) {
      expect(hrefs).toContain(h);
    }
  });

  it("shows a grant only its ticked sections", () => {
    const hrefs = getAdminNavItems(ralf).map((i) => i.href);
    expect(hrefs).toContain("/admin/fast-codes");
    expect(hrefs).toContain("/admin/agents");
    expect(hrefs).not.toContain("/admin/access");
    expect(hrefs).not.toContain("/admin/payments");
    const seoOnly = grantToAdminAccount({ fastCode: "AB12", displayName: null, permissions: ["seo"] });
    expect(getAdminNavItems(seoOnly).map((i) => i.href)).toEqual(["/admin/dashboard", "/admin/notifications", "/admin/seo", "/chat"]);
    expect(accountCanAccessAdminPath(seoOnly, "/admin/mapsites")).toBe(false);
    expect(accountCanAccessAdminPath(seoOnly, "/admin/seo")).toBe(true);
  });

  it("maps sections to grant scopes", () => {
    expect(getRequiredAdminScopeForPath("/admin/access")).toBe("admin-access");
    expect(getRequiredAdminScopeForPath("/admin/registrations")).toBe("registrations");
    expect(getRequiredAdminScopeForPath("/admin/marketing")).toBe("marketing");
    expect(getRequiredAdminScopeForPath("/admin/pmc")).toBe("pmc-pins");
    expect(getRequiredAdminScopeForPath("/admin/seo")).toBe("seo");
    expect(getRequiredAdminScopeForPath("/admin/payments")).toBe("payments");
    expect(accountCanAccessAdminPath(ralf, "/admin/payments")).toBe(false);
    expect(accountCanAccessAdminPath(ralf, "/admin/access")).toBe(false);
    expect(accountCanAccessAdminPath(getAdminAccountByFastCode("ARUN"), "/admin/access")).toBe(true);
  });

  it("keeps active-state matching", () => {
    expect(isAdminNavItemActive("/admin/access", "/admin/access")).toBe(true);
    expect(isAdminNavItemActive("/admin/mapsites", "/admin/mapsites/rm22")).toBe(true);
  });

  it("Admin access page and actions are Global Admin only", () => {
    const page = readFileSync(resolve("app/admin/access/page.tsx"), "utf8");
    expect(page).toContain("isGlobalAdmin(account)");
    const actions = readFileSync(resolve("app/admin/access/actions.ts"), "utf8");
    expect(actions.match(/await requireGlobalAdmin\(\)/g)?.length).toBe(4);
  });
});
