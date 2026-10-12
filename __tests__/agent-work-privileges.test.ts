import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/talispros/mapsite-activation", () => ({ ensureMapSiteActiveAfterPayment: vi.fn() }));

import {
  AGENT_GRANTABLE_SCOPES,
  accountHasAdminScope,
  type AdminAccount,
} from "@/lib/admin-constants";
import { parseCadAmount, parsePaidOnDate } from "@/lib/manual-payments";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function agent(scopes: string[]): AdminAccount {
  return {
    name: "A",
    fastCode: "@a",
    access: "agent",
    agentId: "00000000-0000-0000-0000-000000000001",
    scopes: scopes as AdminAccount["scopes"],
  } as AdminAccount;
}

describe("agent work privileges", () => {
  it("offers the four work privileges as separate grants", () => {
    for (const scope of ["mapsites", "ebooks", "pins", "cash-payments"]) {
      expect(AGENT_GRANTABLE_SCOPES).toContain(scope);
    }
  });

  it("does not leak one privilege into another", () => {
    const pinsOnly = agent(["pins"]);
    expect(accountHasAdminScope(pinsOnly, "pins")).toBe(true);
    expect(accountHasAdminScope(pinsOnly, "cash-payments")).toBe(false);
    expect(accountHasAdminScope(pinsOnly, "agents")).toBe(false);
  });

  it("parses CAD amounts and payment dates strictly", () => {
    expect(parseCadAmount("499")).toBe(499);
    expect(parseCadAmount("1,234.50")).toBe(1234.5);
    expect(parseCadAmount("0")).toBeNull();
    expect(parseCadAmount("-5")).toBeNull();
    expect(parseCadAmount("12.345")).toBeNull();
    expect(parseCadAmount("abc")).toBeNull();
    const now = new Date("2026-10-12T10:00:00Z");
    expect(parsePaidOnDate("2026-10-12", now)).toBe("2026-10-12");
    expect(parsePaidOnDate("2026-12-01", now)).toBeNull();
    expect(parsePaidOnDate("12/10/2026", now)).toBeNull();
  });

  it("checks privilege + assignment server-side and audits with the agent id", () => {
    const src = read("app/admin/agent/actions.ts");
    expect(src).toMatch(/agentCanEditMapSite\(account, fastCode, scope\)/);
    expect(src).toMatch(/requireAgentWith\("pins"/);
    expect(src).toMatch(/requireAgentWith\("cash-payments"/);
    expect(src).toMatch(/\[agent:\$\{account\.agentId\}\]/);
    expect(src).toMatch(/AGENT_MAX_PINS_PER_ACTION/);
  });

  it("cash payments reuse the shared activation step and are reversible by managers only", () => {
    expect(read("lib/manual-payments.ts")).toMatch(/ensureMapSiteActiveAfterPayment\(/);
    const manager = read("app/admin/agents/actions.ts");
    expect(manager).toMatch(/export async function reverseCashPaymentAction[\s\S]*requireAgentManager\(\)/);
  });

  it("ebook and PIN flows use their own privilege checks; delete stays Global Admin", () => {
    expect(read("app/talispros/mapsite/pin-actions.ts")).toMatch(/canManageMapSitePins/);
    expect(read("app/talisbooks/library/actions.ts")).toMatch(/canManageMapSiteEbooks/);
    expect(read("lib/mapsite-admin-service.ts")).toMatch(/deleteAdminActiveMapSite[\s\S]{0,200}isAdminAuthenticated/);
    const migration = read("supabase/migrations/097_agent_privileges_manual_payments.sql");
    expect(migration).toMatch(/enable row level security/);
    expect(migration).not.toMatch(/drop table/i);
  });
});
