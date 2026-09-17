import { describe, expect, it } from "vitest";
import {
  ADMIN_ACCOUNTS,
  ADMIN_FAST_CODE,
  accountHasAdminScope,
  getAdminAccountByEmail,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
  isElevatedAdminAccess,
} from "../lib/admin-constants";
import { accountCanAccessAdminPath, getRequiredAdminScopeForPath } from "../lib/admin-route-access";
import { getAdminNavItems, isAdminNavItemActive } from "../lib/admin-nav";

describe("admin access accounts", () => {
  it("authorizes Ralf by FAST code rm22 and email as SUPERADMIN", () => {
    const byCode = getAdminAccountByFastCode("rm22");
    const byEmail = getAdminAccountByEmail("remecom@mac.com");
    expect(byCode?.name).toBe("Ralf");
    expect(byCode?.fastCode).toBe("RM22");
    expect(byCode?.access).toBe("superadmin");
    expect(byEmail?.fastCode).toBe("RM22");
    expect(isAuthorizedAdminFastCode("rm22")).toBe(true);
    expect(isElevatedAdminAccess(byCode?.access)).toBe(true);
    expect(accountHasAdminScope(byCode, "platform-content")).toBe(true);
    expect(accountHasAdminScope(byCode, "fast-codes")).toBe(true);
    expect(accountHasAdminScope(byCode, "talisbooks")).toBe(true);
    expect(accountHasAdminScope(byCode, "mapsites")).toBe(true);
    expect(accountHasAdminScope(byCode, "full-console")).toBe(false);
  });

  it("authorizes Arun with full admin via ARUN / arun@kyptronix.com", () => {
    const byCode = getAdminAccountByFastCode("arun");
    const byEmail = getAdminAccountByEmail("ARUN@kyptronix.com");
    expect(byCode?.name).toBe("Arun");
    expect(byCode?.access).toBe("full");
    expect(byEmail?.email).toBe("arun@kyptronix.com");
    expect(isAuthorizedAdminFastCode("ARUN")).toBe(true);
    expect(accountHasAdminScope(byCode, "full-console")).toBe(true);
  });

  it("keeps the legacy ADMIN123 platform code", () => {
    expect(isAuthorizedAdminFastCode(ADMIN_FAST_CODE)).toBe(true);
    expect(getAdminAccountByFastCode(ADMIN_FAST_CODE)?.access).toBe("full");
  });

  it("rejects unknown codes and emails", () => {
    expect(isAuthorizedAdminFastCode("DEMO")).toBe(false);
    expect(getAdminAccountByEmail("rahulc@talispros.com")).toBeNull();
  });

  it("includes Ralf and Arun in the account roster", () => {
    const emails = ADMIN_ACCOUNTS.map((account) => account.email);
    expect(emails).toContain("remecom@mac.com");
    expect(emails).toContain("arun@kyptronix.com");
  });
});

describe("admin nav", () => {
  it("gives site-ops links for build requests, mapsites, and books", () => {
    const hrefs = getAdminNavItems("site-ops").map((item) => item.href);
    expect(hrefs).toEqual([
      "/admin/dashboard",
      "/admin/build-requests",
      "/admin/mapsites",
      "/admin/talisbooks",
      "/admin/talisbooks/bookshelves",
    ]);
    expect(hrefs).not.toContain("/admin/content");
    expect(hrefs).not.toContain("/admin/platform-content");
    expect(hrefs).not.toContain("/admin/fast-codes");
    expect(hrefs).not.toContain("/admin/pricing");
    expect(hrefs).not.toContain("/admin/payments");
  });

  it("gives Ralf SUPERADMIN links for FAST codes, mapsites, and books", () => {
    const hrefs = getAdminNavItems("superadmin").map((item) => item.href);
    expect(hrefs).toEqual([
      "/admin/dashboard",
      "/admin/build-requests",
      "/admin/mapsites",
      "/admin/talisbooks",
      "/admin/talisbooks/bookshelves",
      "/admin/fast-codes",
    ]);
    expect(hrefs).not.toContain("/admin/platform-content");
    expect(hrefs).not.toContain("/admin/content");
    expect(hrefs).not.toContain("/admin/pricing");
    expect(hrefs).not.toContain("/admin/payments");
    expect(hrefs).not.toContain("/admin/users");
  });

  it("gives Arun the SUPERADMIN links plus the rest of the existing console", () => {
    const hrefs = getAdminNavItems("full").map((item) => item.href);
    expect(hrefs).not.toContain("/admin/content");
    expect(hrefs).not.toContain("/admin/associates");
    expect(hrefs).not.toContain("/admin/talisbot");
    expect(hrefs).not.toContain("/admin/products");
    expect(hrefs).not.toContain("/admin/leads");
    expect(hrefs).not.toContain("/admin/leads-simulation");
    expect(hrefs).not.toContain("/admin/deals");
    expect(hrefs).not.toContain("/admin/users");
    expect(hrefs).not.toContain("/admin/applications");
    expect(hrefs).not.toContain("/admin/project-applications");
    expect(hrefs).not.toContain("/admin/platform-content");
    expect(hrefs).toContain("/admin/fast-codes");
    expect(hrefs).toContain("/admin/build-requests");
    expect(hrefs).toContain("/admin/mapsites");
    expect(hrefs).toContain("/admin/talisbooks");
    expect(hrefs).toContain("/admin/talisbooks/bookshelves");
    expect(hrefs).toContain("/admin/registrations");
    expect(hrefs).toContain("/admin/marketing");
  });

  it("highlights nested Mapsite, platform content, and Talisbooks routes", () => {
    expect(isAdminNavItemActive("/admin/mapsites", "/admin/mapsites/rm22")).toBe(true);
    expect(isAdminNavItemActive("/admin/build-requests", "/admin/marketing/abc")).toBe(true);
    expect(isAdminNavItemActive("/admin/platform-content", "/admin/platform-content")).toBe(true);
    expect(isAdminNavItemActive("/admin/platform-content", "/talispros/marketing/admin")).toBe(true);
    expect(isAdminNavItemActive("/admin/talisbooks", "/admin/talisbooks/centerfolds")).toBe(true);
    expect(isAdminNavItemActive("/admin/talisbooks", "/admin/talisbooks/bookshelves")).toBe(false);
    expect(isAdminNavItemActive("/admin/talisbooks/bookshelves", "/admin/talisbooks/bookshelves")).toBe(
      true,
    );
  });
});

describe("admin route scopes", () => {
  const ralf = getAdminAccountByFastCode("rm22");
  const arun = getAdminAccountByFastCode("ARUN");

  it("maps product-management paths to SUPERADMIN scopes", () => {
    expect(getRequiredAdminScopeForPath("/admin/platform-content")).toBe("platform-content");
    expect(getRequiredAdminScopeForPath("/admin/fast-codes")).toBe("fast-codes");
    expect(getRequiredAdminScopeForPath("/admin/mapsites/rm22")).toBe("mapsites");
    expect(getRequiredAdminScopeForPath("/admin/talisbooks")).toBe("talisbooks");
    expect(getRequiredAdminScopeForPath("/admin/products")).toBe("platform-content");
    expect(getRequiredAdminScopeForPath("/admin/pricing")).toBe("full-console");
    expect(getRequiredAdminScopeForPath("/admin/payments")).toBe("full-console");
  });

  it("allows Ralf SUPERADMIN tools and blocks payments/users", () => {
    expect(accountCanAccessAdminPath(ralf, "/admin/platform-content")).toBe(true);
    expect(accountCanAccessAdminPath(ralf, "/admin/fast-codes")).toBe(true);
    expect(accountCanAccessAdminPath(ralf, "/admin/mapsites/rm22")).toBe(true);
    expect(accountCanAccessAdminPath(ralf, "/admin/talisbooks")).toBe(true);
    expect(accountCanAccessAdminPath(ralf, "/admin/products")).toBe(true);
    expect(accountCanAccessAdminPath(ralf, "/admin/pricing")).toBe(false);
    expect(accountCanAccessAdminPath(ralf, "/admin/payments")).toBe(false);
    expect(accountCanAccessAdminPath(ralf, "/admin/users")).toBe(false);
    expect(accountCanAccessAdminPath(null, "/admin/platform-content")).toBe(false);
  });

  it("allows Arun the full console", () => {
    expect(accountCanAccessAdminPath(arun, "/admin/users")).toBe(true);
    expect(accountCanAccessAdminPath(arun, "/admin/platform-content")).toBe(true);
  });
});
