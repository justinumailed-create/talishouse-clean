import { describe, expect, it } from "vitest";
import {
  ADMIN_ACCOUNTS,
  ADMIN_FAST_CODE,
  getAdminAccountByEmail,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
} from "../lib/admin-constants";
import { getAdminNavItems, isAdminNavItemActive } from "../lib/admin-nav";

describe("admin access accounts", () => {
  it("authorizes Ralph by FAST code rm22 and email", () => {
    const byCode = getAdminAccountByFastCode("rm22");
    const byEmail = getAdminAccountByEmail("remecom@mac.com");
    expect(byCode?.name).toBe("Ralph");
    expect(byCode?.fastCode).toBe("RM22");
    expect(byCode?.access).toBe("site-ops");
    expect(byEmail?.fastCode).toBe("RM22");
    expect(isAuthorizedAdminFastCode("rm22")).toBe(true);
  });

  it("authorizes Arun with full admin via ARUN / arun@kyptronix.com", () => {
    const byCode = getAdminAccountByFastCode("arun");
    const byEmail = getAdminAccountByEmail("ARUN@kyptronix.com");
    expect(byCode?.name).toBe("Arun");
    expect(byCode?.access).toBe("full");
    expect(byEmail?.email).toBe("arun@kyptronix.com");
    expect(isAuthorizedAdminFastCode("ARUN")).toBe(true);
  });

  it("keeps the legacy ADMIN123 platform code", () => {
    expect(isAuthorizedAdminFastCode(ADMIN_FAST_CODE)).toBe(true);
    expect(getAdminAccountByFastCode(ADMIN_FAST_CODE)?.access).toBe("full");
  });

  it("rejects unknown codes and emails", () => {
    expect(isAuthorizedAdminFastCode("DEMO")).toBe(false);
    expect(getAdminAccountByEmail("rahulc@talispros.com")).toBeNull();
  });

  it("includes Ralph and Arun in the account roster", () => {
    const emails = ADMIN_ACCOUNTS.map((account) => account.email);
    expect(emails).toContain("remecom@mac.com");
    expect(emails).toContain("arun@kyptronix.com");
  });
});

describe("admin nav", () => {
  it("gives Ralph site-ops links for content, build requests, mapsites, and books", () => {
    const hrefs = getAdminNavItems("site-ops").map((item) => item.href);
    expect(hrefs).toEqual([
      "/admin/dashboard",
      "/admin/content",
      "/admin/build-requests",
      "/admin/mapsites",
      "/admin/talisbooks",
      "/admin/talisbooks/bookshelves",
    ]);
    expect(hrefs).not.toContain("/admin/pricing");
    expect(hrefs).not.toContain("/admin/payments");
  });

  it("gives Arun the site-ops links plus the rest of the existing console", () => {
    const hrefs = getAdminNavItems("full").map((item) => item.href);
    expect(hrefs).toContain("/admin/content");
    expect(hrefs).toContain("/admin/build-requests");
    expect(hrefs).toContain("/admin/mapsites");
    expect(hrefs).toContain("/admin/talisbooks");
    expect(hrefs).toContain("/admin/talisbooks/bookshelves");
    expect(hrefs).toContain("/admin/registrations");
    expect(hrefs).toContain("/admin/marketing");
  });

  it("highlights nested Mapsite and Talisbooks routes", () => {
    expect(isAdminNavItemActive("/admin/mapsites", "/admin/mapsites/rm22")).toBe(true);
    expect(isAdminNavItemActive("/admin/build-requests", "/admin/marketing/abc")).toBe(true);
    expect(isAdminNavItemActive("/admin/talisbooks", "/admin/talisbooks/centerfolds")).toBe(true);
    expect(isAdminNavItemActive("/admin/talisbooks", "/admin/talisbooks/bookshelves")).toBe(false);
    expect(isAdminNavItemActive("/admin/talisbooks/bookshelves", "/admin/talisbooks/bookshelves")).toBe(
      true,
    );
  });
});
