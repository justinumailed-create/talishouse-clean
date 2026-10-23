import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ACCOUNTS,
  AGENT_GRANTABLE_SCOPES,
  accountHasAdminScope,
  adminHomePath,
  getAdminAccountByFastCode,
  sanitizeAgentScopes,
  type AdminAccount,
} from "../lib/admin-constants";
import { accountCanAccessAdminPath } from "../lib/admin-route-access";
import { getAdminNavItems } from "../lib/admin-nav";
import { resolveAdminRequestGate } from "../lib/admin-request-gate";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

const agent = (scopes: string[], assigned: string[] = []): AdminAccount => ({
  name: "Test Agent",
  fastCode: "@test.agent",
  loginId: "test.agent",
  email: null,
  access: "agent",
  scopes: sanitizeAgentScopes(scopes),
  agentId: "00000000-0000-0000-0000-000000000001",
  assignedMapSites: assigned,
});

describe("agent privileges", () => {
  it("never lets agents hold admin-management scopes", () => {
    expect(AGENT_GRANTABLE_SCOPES).not.toContain("agents");
    expect(AGENT_GRANTABLE_SCOPES).not.toContain("fast-codes");
    expect(AGENT_GRANTABLE_SCOPES).not.toContain("full-console");
    expect(AGENT_GRANTABLE_SCOPES).not.toContain("platform-content");
    const a = agent(["agents", "full-console", "fast-codes", "mapsites", "mapsites"]);
    expect(a.scopes).toEqual(["mapsites"]);
    expect(accountHasAdminScope(a, "agents")).toBe(false);
    expect(accountHasAdminScope(a, "full-console")).toBe(false);
    expect(accountHasAdminScope(a, "dashboard")).toBe(false);
    expect(accountHasAdminScope(a, "mapsites")).toBe(true);
  });

  it("enforces granted scopes on admin paths", () => {
    const a = agent(["mapsites", "leads"]);
    expect(accountCanAccessAdminPath(a, "/admin/agent")).toBe(true);
    expect(accountCanAccessAdminPath(a, "/admin/mapsites/rm22")).toBe(true);
    expect(accountCanAccessAdminPath(a, "/admin/leads")).toBe(true);
    expect(accountCanAccessAdminPath(a, "/admin/agents")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/agents/x/preview")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/fast-codes")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/dashboard")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/notifications")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/pmc")).toBe(false);
    expect(accountCanAccessAdminPath(a, "/admin/agent/page")).toBe(false);
    // Agents can no longer edit their own pages: the route and privilege are gone.
    expect(accountCanAccessAdminPath(agent(["mapsites", "ebooks", "pins", "cash-payments"]), "/admin/agent/page")).toBe(false);
    expect(adminHomePath(a)).toBe("/admin/agent");
  });

  it("gives the Global Admin (ARUN) the Agents section", () => {
    expect(accountHasAdminScope(getAdminAccountByFastCode("ARUN"), "agents")).toBe(true);
    expect(getAdminNavItems(getAdminAccountByFastCode("ARUN")).map((i) => i.href)).toContain("/admin/agents");
    expect(ADMIN_ACCOUNTS.map((a) => a.fastCode)).toEqual(["ARUN"]);
  });

  it("builds agent nav only from granted privileges", () => {
    expect(getAdminNavItems(agent([])).map((i) => i.href)).toEqual(["/admin/agent", "/admin/agent/notes", "/chat"]);
    const hrefs = getAdminNavItems(agent(["agent-pages", "build-requests"] as string[])).map((i) => i.href);
    expect(hrefs).toEqual(["/admin/agent", "/admin/agent/notes", "/chat", "/admin/build-requests"]);
  });
});

describe("agent session gate", () => {
  it("lets well-formed agent session tokens reach the server-side layout check", () => {
    const token = "A".repeat(43);
    expect(
      resolveAdminRequestGate({ pathname: "/admin/agent", agentSessionCookie: token }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({ pathname: "/admin/agent", agentSessionCookie: "short" }),
    ).toEqual({ action: "redirect", to: "/agent/login?next=%2Fadmin%2Fagent" });
    // Agent tokens are never accepted in the FAST-code admin cookie.
    expect(
      resolveAdminRequestGate({ pathname: "/admin/agent", adminSessionCookie: token }),
    ).toEqual({ action: "redirect", to: "/agent/login?next=%2Fadmin%2Fagent" });
  });

  it("re-validates agents against the DB and keeps them out of builtin-only checks", () => {
    const auth = readSource("lib/admin-auth.ts");
    expect(auth).toContain("getAgentBySessionToken(token)");
    expect(auth).not.toContain("getAgentByFastCode");
    expect(auth).toContain("return isGlobalAdmin(await resolveAdminSessionAccount());");
    const actions = readSource("app/admin/agents/actions.ts");
    expect(actions).toContain('requireAdminScope("agents")');
    expect(actions).toContain('account.access === "agent" ? null : account');
    expect(readSource("lib/talispros/mapsite-free-pin-admin-actions.ts")).toContain(
      'account.access === "agent" ? null : account',
    );
  });

  it("hashes passwords with bcrypt, stores only token hashes, and locks out", () => {
    const svc = readSource("lib/agent-admins.ts");
    expect(svc).toContain('import bcrypt from "bcryptjs"');
    expect(svc).toContain("bcrypt.hash(password, BCRYPT_COST)");
    expect(svc).toContain('createHash("sha256")');
    expect(svc).toContain("AGENT_MAX_FAILED_ATTEMPTS");
    expect(svc).toContain("scopes: agent.mustChangePassword ? [] : agent.privileges");
    expect(svc).not.toMatch(/console\.(log|info)\([^)]*password/i);
  });

  it("ships an additive, RLS-enabled migration", () => {
    const sql = readSource("supabase/migrations/096_agent_admins.sql");
    expect(sql).toContain("create table if not exists public.agent_admins");
    expect(sql).toContain("alter table public.agent_admins enable row level security");
    expect(sql).toContain("alter table public.agent_admin_sessions enable row level security");
    expect(sql).toContain("password_hash text");
    expect(sql).not.toMatch(/fast_code/);
    expect(sql).not.toMatch(/\bdrop\b|\balter table public\.(?!agent_admin)/i);
  });
});
