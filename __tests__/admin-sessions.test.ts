import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- In-memory Supabase fake (just the query-builder calls admin sessions use).
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};

function builder(table: string) {
  let op: "select" | "update" | "insert" = "select";
  let patch: Row = {};
  let returning = false;
  const filters: Array<(r: Row) => boolean> = [];
  const rows = () => (tables[table] ??= []);
  const run = () => {
    if (op === "insert") {
      rows().push({ id: crypto.randomUUID(), revoked_at: null, ...patch });
      return { data: null, error: null };
    }
    const hit = rows().filter((r) => filters.every((f) => f(r)));
    if (op === "update") hit.forEach((r) => Object.assign(r, patch));
    return { data: op === "update" && !returning ? null : hit, error: null };
  };
  const b = {
    select() { if (op === "select") op = "select"; else returning = true; return b; },
    insert(v: Row) { op = "insert"; patch = v; return b; },
    update(v: Row) { op = "update"; patch = v; return b; },
    eq(c: string, v: unknown) { filters.push((r) => r[c] === v); return b; },
    neq(c: string, v: unknown) { filters.push((r) => r[c] !== v); return b; },
    is(c: string, v: unknown) { filters.push((r) => (r[c] ?? null) === v); return b; },
    maybeSingle() { const { data } = run(); return Promise.resolve({ data: (data as Row[])[0] ?? null, error: null }); },
    then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) { return Promise.resolve(run()).then(res, rej); },
  };
  return b;
}

vi.mock("../lib/supabaseAdmin", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseAdmin: () => ({ from: (t: string) => builder(t) }),
}));

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => { jar.set(name, value); },
    delete: (name: string) => { jar.delete(name); },
  }),
}));

import {
  adminSessionRejection,
  hashAdminSessionToken,
  isAdminSessionTokenShape,
  revokeAllAdminSessions,
} from "../lib/admin-sessions";
import { getAdminSessionAccount, writeAdminSessionCookie, clearAdminSessionCookie } from "../lib/admin-auth";
import { ADMIN_SESSION_COOKIE, GLOBAL_ADMIN_FAST_CODE } from "../lib/admin-constants";

const GRANT_ID = "11111111-2222-4333-8444-555555555555";
const GRANT_CODE = "ZZ99";

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  jar.clear();
  tables.admin_access_grants = [{
    id: GRANT_ID, fast_code: GRANT_CODE, display_name: "Granted", email: null,
    permissions: ["seo"], granted_by: "test", created_at: "", updated_at: "", revoked_at: null, revoked_by: null,
  }];
});

const sessions = () => tables.admin_sessions ?? [];

describe("server-side admin sessions", () => {
  it("login stores only a SHA-256 hash; the cookie holds a random 43-char token, never the FAST Code", async () => {
    const account = await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    expect(account?.access).toBe("global");
    const token = jar.get(ADMIN_SESSION_COOKIE)!;
    expect(isAdminSessionTokenShape(token)).toBe(true);
    expect(token).not.toContain(GLOBAL_ADMIN_FAST_CODE);
    expect(sessions()).toHaveLength(1);
    const row = sessions()[0];
    expect(row.token_hash).toBe(hashAdminSessionToken(token));
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(row)).not.toContain(`"${GLOBAL_ADMIN_FAST_CODE}"`);
    expect(row.access).toBe("global");
    expect(row.grant_id).toBeNull();
    expect((await getAdminSessionAccount())?.access).toBe("global");
  });

  it("granted login references the grant id, not the code", async () => {
    await writeAdminSessionCookie(GRANT_CODE);
    expect(sessions()[0].grant_id).toBe(GRANT_ID);
    expect(JSON.stringify(sessions()[0])).not.toContain(GRANT_CODE);
    expect((await getAdminSessionAccount())?.access).toBe("granted");
  });

  it("rejects a cookie that contains a FAST Code", async () => {
    jar.set(ADMIN_SESSION_COOKIE, GLOBAL_ADMIN_FAST_CODE);
    expect(await getAdminSessionAccount()).toBeNull();
    jar.set(ADMIN_SESSION_COOKIE, GRANT_CODE);
    expect(await getAdminSessionAccount()).toBeNull();
  });

  it("rejects a random or forged token", async () => {
    await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    jar.set(ADMIN_SESSION_COOKIE, "x".repeat(43));
    expect(await getAdminSessionAccount()).toBeNull();
    jar.set(ADMIN_SESSION_COOKIE, "not a token");
    expect(await getAdminSessionAccount()).toBeNull();
    // A stored hash used as the cookie value is not a valid token either.
    jar.set(ADMIN_SESSION_COOKIE, String(sessions()[0].token_hash));
    expect(await getAdminSessionAccount()).toBeNull();
  });

  it("rejects revoked, expired and idle (>90s) sessions", async () => {
    await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    const row = sessions()[0];
    row.revoked_at = new Date().toISOString();
    expect(await getAdminSessionAccount()).toBeNull();

    row.revoked_at = null;
    row.expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await getAdminSessionAccount()).toBeNull();
    expect(row.revoked_at).not.toBeNull();

    row.revoked_at = null;
    row.expires_at = new Date(Date.now() + 3600_000).toISOString();
    row.last_seen_at = new Date(Date.now() - 91_000).toISOString();
    expect(await getAdminSessionAccount()).toBeNull();

    const now = Date.now();
    const base = { revoked_at: null, expires_at: new Date(now + 1000).toISOString() };
    expect(adminSessionRejection({ ...base, last_seen_at: new Date(now - 60_000).toISOString() }, now)).toBeNull();
    expect(adminSessionRejection({ ...base, last_seen_at: new Date(now - 91_000).toISOString() }, now)).toBe("idle");
  });

  it("revoked grant → its sessions are rejected", async () => {
    await writeAdminSessionCookie(GRANT_CODE);
    tables.admin_access_grants[0].revoked_at = new Date().toISOString();
    expect(await getAdminSessionAccount()).toBeNull();
  });

  it("refreshes last_seen_at on use", async () => {
    await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    const old = new Date(Date.now() - 30_000).toISOString();
    sessions()[0].last_seen_at = old;
    expect(await getAdminSessionAccount()).not.toBeNull();
    expect(Date.parse(String(sessions()[0].last_seen_at))).toBeGreaterThan(Date.parse(old));
  });

  it("logout revokes the row server-side; revoke-all keeps only the caller", async () => {
    await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    const first = jar.get(ADMIN_SESSION_COOKIE)!;
    await clearAdminSessionCookie();
    expect(sessions()[0].revoked_at).not.toBeNull();
    jar.set(ADMIN_SESSION_COOKIE, first);
    expect(await getAdminSessionAccount()).toBeNull();

    await writeAdminSessionCookie(GLOBAL_ADMIN_FAST_CODE);
    const mine = jar.get(ADMIN_SESSION_COOKIE)!;
    await writeAdminSessionCookie(GRANT_CODE);
    jar.set(ADMIN_SESSION_COOKIE, mine);
    expect(await revokeAllAdminSessions({ keepToken: mine })).toBe(1);
    expect(await getAdminSessionAccount()).not.toBeNull();
    expect(await revokeAllAdminSessions()).toBe(1);
    expect(await getAdminSessionAccount()).toBeNull();
  });

  it("cookie is httpOnly, SameSite=Lax and Secure in production", () => {
    const auth = readFileSync(join(process.cwd(), "lib/admin-auth.ts"), "utf8");
    expect(auth).toMatch(/httpOnly: true/);
    expect(auth).toMatch(/sameSite: "lax"/);
    expect(auth).toMatch(/secure: process\.env\.NODE_ENV === "production"/);
  });
});

describe("no secret in client code", () => {
  const root = process.cwd();
  const clientFiles: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?)$/.test(name) && readFileSync(p, "utf8").startsWith('"use client"')) clientFiles.push(p);
    }
  };
  walk(join(root, "components"));
  walk(join(root, "app"));

  it("client components never import the session store or a KB password", () => {
    expect(clientFiles.length).toBeGreaterThan(10);
    for (const f of clientFiles) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toContain("admin-sessions");
      expect(src, f).not.toContain("TALISU_KB_PASSWORD");
      expect(src, f).not.toContain("isTalisUKbPassword");
    }
    const kbGate = readFileSync(join(root, "lib/talisu/kb-gate.ts"), "utf8");
    expect(kbGate).not.toMatch(/PASSWORD/);
  });

  it("retired admin codes are kept server-side as SHA-256 digests only", () => {
    const src = readFileSync(join(root, "lib/admin-retired-codes.ts"), "utf8");
    const list = src.slice(src.indexOf("HASHES: readonly string[] = ["), src.indexOf("];"));
    const values = list.match(/"[^"]*"/g) ?? [];
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) expect(v).toMatch(/^"[0-9a-f]{64}"$/);
    const constants = readFileSync(join(root, "lib/admin-constants.ts"), "utf8");
    expect(constants).not.toContain("RETIRED_ADMIN_FAST_CODES");
    expect(readFileSync(join(root, "lib/fast-code.ts"), "utf8")).not.toContain("isRetiredAdminFastCode");
  });

  it("built client output (if present) has no session-table code", () => {
    const dir = join(root, ".next/static");
    if (!existsSync(dir)) return;
    const hits: string[] = [];
    const scan = (d: string) => {
      for (const name of readdirSync(d)) {
        const p = join(d, name);
        if (statSync(p).isDirectory()) scan(p);
        else if (name.endsWith(".js") && readFileSync(p, "utf8").includes("admin_sessions")) hits.push(p);
      }
    };
    scan(dir);
    expect(hits).toEqual([]);
  });
});
