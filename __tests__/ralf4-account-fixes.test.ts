import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAssignFastCode } from "../lib/talispros/assign-demo-ebook";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Ralf 4 — Assign demo eBook to account", () => {
  it("shows ASSIGN TO ACCOUNT beside Claim Your Market™ (EN/DE)", () => {
    const claim = read("components/talispros/mapsite/DemoClaimMarketButton.tsx");
    expect(claim).toContain("<DemoAssignToAccountButton");
    expect(read("lib/i18n/dictionaries/en.ts")).toContain('assignCta: "Assign to account"');
    expect(read("lib/i18n/dictionaries/de.ts")).toContain('assignCta: "Konto zuweisen"');
  });

  it("checks paid-up status server-side, logs attribution and restricts who can assign", () => {
    const lib = read("lib/talispros/assign-demo-ebook.ts");
    expect(lib).toContain("hasCompletedMapSiteActivationPayment");
    expect(lib).toContain('reason: "not_paid"');
    expect(lib).toContain('from("ebook_assignments").insert');
    expect(lib).toContain("isProtectedPlatformDemoMapSite");
    const action = read("app/talispros/demo-mapsite/assign-actions.ts");
    expect(action).toMatch(/accountHasAdminScope\(account, "talisbooks"\)/);
    expect(action).toMatch(/agentCanEditMapSite\(account, targetCode, "ebooks"\)/);
    expect(action).toContain("owner === targetCode");
    expect(read("supabase/migrations/105_ebook_assignments_pin_attribution.sql")).toContain("enable row level security");
  });

  it("normalizes FAST Codes and rejects junk", () => {
    expect(normalizeAssignFastCode(" RM22 ")).toBe("rm22");
    expect(normalizeAssignFastCode("a b")).toBeNull();
    expect(normalizeAssignFastCode("")).toBeNull();
  });
});

describe("Ralf 4 — phantom flags", () => {
  it("records who placed each extra PIN and shows staff-placed PINs to the owner", () => {
    expect(read("app/talispros/mapsite/pin-actions.ts")).toContain("createdBy: await resolvePinActor(fastCode)");
    expect(read("lib/talispros/mapsite-additional-pins-service.ts")).toContain("created_by_kind: input.createdBy?.kind");
    expect(read("components/talispros/mapsite/MapSitePinDashboard.tsx")).toContain("pin-placed-by-staff");
  });
});

describe("Ralf 4 — Knowledge Base", () => {
  it("removes the Knowledge Base pill from account pages", () => {
    const card = read("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx");
    expect(card).not.toContain("TALISU_KB_MANAGE_PATH");
    expect(card).not.toContain("t.mapsite.knowledgeBase");
  });

  it("always asks for a FAST Code (no signed-in bypass) and unlocks with a valid one", () => {
    const actions = read("app/talisu/kb/access-actions.ts");
    // Oct 26: signed-in owners / agents / admins no longer open the KB directly.
    expect(actions).not.toContain("getTalisUKbSessionAccessAction");
    expect(actions).not.toContain("getAdminSessionAccount");
    expect(actions).not.toContain("getMapSiteOwnerSession");
    expect(actions).toContain("resolveFastCodeAdminAccount(value)");
    expect(actions).toContain("hasCompletedMapSiteActivationPayment");
    const gate = read("components/talisu/TalisUKbPasswordGate.tsx");
    expect(gate).not.toContain("getTalisUKbSessionAccessAction");
    expect(gate).not.toContain("writeTalisUKbUnlocked");
    expect(gate).toContain("readTalisUKbUnlocked()");
    const form = read("components/talisu/TalisUKbUnlockForm.tsx");
    expect(form).toContain("unlockTalisUKbAction(value)");
    expect(form).not.toContain("isTalisUKbPassword(password)");
  });
});
