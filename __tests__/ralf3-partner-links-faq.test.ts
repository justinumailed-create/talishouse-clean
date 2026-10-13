import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canLinkMapSitePartners, partnersFromLinks, sortPartnerPair } from "../lib/talispros/mapsite-partner-links";
import { TALISU_ESSAYS, resolveTalisUEssaySlug } from "../components/talisu/essay-registry";
import { TALISU_STUDENT_HOUSING_ESSAY } from "../lib/talisu/student-housing-essay";

describe("Ralf 3 — partner-linked Mapsites", () => {
  it("stores pairs sorted and resolves partners (2+ supported)", () => {
    expect(sortPartnerPair("RM22", "lg01")).toEqual(["lg01", "rm22"]);
    const links = [
      { fastCodeA: "lg01", fastCodeB: "rm22" },
      { fastCodeA: "ab01", fastCodeB: "rm22" },
    ];
    expect(partnersFromLinks(links, "RM22")).toEqual(["ab01", "lg01"]);
    expect(partnersFromLinks(links, "lg01")).toEqual(["rm22"]);
    expect(partnersFromLinks(links, "zz99")).toEqual([]);
  });

  it("link/unlink needs the partner-linking permission (Global Admin always)", async () => {
    const c = await import("../lib/admin-constants");
    expect(canLinkMapSitePartners(c.getAdminAccountByFastCode("ARUN"))).toBe(true);
    expect(canLinkMapSitePartners(c.grantToAdminAccount({ fastCode: "RM22", displayName: "Ralf", permissions: ["partner-linking"] }))).toBe(true);
    expect(canLinkMapSitePartners(c.grantToAdminAccount({ fastCode: "AB12", displayName: null, permissions: ["mapsites"] }))).toBe(false);
    expect(canLinkMapSitePartners(null)).toBe(false);
    const actions = readFileSync(resolve("app/admin/mapsites/partner-link-actions.ts"), "utf8");
    expect(actions).toContain("canLinkMapSitePartners(account)");
    const page = readFileSync(resolve("app/admin/mapsites/page.tsx"), "utf8");
    expect(page).toContain("canLinkMapSitePartners(account)");
  });

  it("ships migration 103 with RLS", () => {
    const sql = readFileSync(resolve("supabase/migrations/103_mapsite_partner_links.sql"), "utf8");
    expect(sql).toContain("create table if not exists public.mapsite_partner_links");
    expect(sql).toContain("enable row level security");
  });
});

describe("Ralf 3 — Student Housing essay tab", () => {
  it("is the 3rd essay with 7 Coming soon placeholders after it", () => {
    expect(TALISU_ESSAYS[2]?.slug).toBe("student-housing");
    expect(TALISU_ESSAYS[2]?.label).toEqual({ en: "Student Housing", de: "Studentenwohnen" });
    expect(TALISU_ESSAYS.filter((e) => e.content === null)).toHaveLength(7);
    expect(resolveTalisUEssaySlug("student-housing")).toBe("student-housing");
  });

  it("has EN + DE bodies, CAD-only amounts and no stray citation fragments", () => {
    for (const locale of ["en", "de"] as const) {
      const json = JSON.stringify(TALISU_STUDENT_HOUSING_ESSAY[locale]);
      expect(json).not.toMatch(/\+1/);
      expect(json).not.toMatch(/(^|[^A])\$/);
      expect(json).not.toContain("USD");
      expect(TALISU_STUDENT_HOUSING_ESSAY[locale].sections).toHaveLength(7);
    }
    expect(TALISU_STUDENT_HOUSING_ESSAY.de.title).not.toBe(TALISU_STUDENT_HOUSING_ESSAY.en.title);
  });
});
