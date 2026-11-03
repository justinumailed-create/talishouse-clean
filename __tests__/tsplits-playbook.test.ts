import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const failures = { count: 0, inserts: [] as unknown[] };
vi.mock("@/lib/supabaseAdmin", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    gte: () => Promise.resolve({ count: failures.count }),
    insert: (row: unknown) => {
      failures.inserts.push(row);
      return Promise.resolve({ error: null });
    },
  };
  return { isSupabaseAdminConfigured: () => true, getSupabaseAdmin: () => ({ from: () => chain }) };
});

import {
  TSPLITS_PLAYBOOK_ENV,
  isTsplitsPlaybookConfigured,
  isTsplitsPlaybookPasscode,
  redeemTsplitsPlaybookPasscode,
  signTsplitsPlaybookCookie,
  tsplitsPlaybookCookieOptions,
  verifyTsplitsPlaybookCookie,
} from "@/lib/talisu/tsplits-playbook.server";
import { TSPLITS_PLAYBOOK_COPY, TSPLITS_PLAYBOOK_PATH } from "@/lib/talisu/tsplits-playbook";

const ROOT = process.cwd();
// Synthetic values used only inside this test process.
const TEST_CODE_A = "unit-test-code-alpha";
const TEST_CODE_B = "unit-test-code-bravo";

describe("Tsplits™ Sales Playbook gate", () => {
  const saved = process.env[TSPLITS_PLAYBOOK_ENV];
  beforeEach(() => {
    failures.count = 0;
    failures.inserts = [];
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[TSPLITS_PLAYBOOK_ENV];
    else process.env[TSPLITS_PLAYBOOK_ENV] = saved;
  });

  it("stays locked when the env var is unset", async () => {
    delete process.env[TSPLITS_PLAYBOOK_ENV];
    expect(isTsplitsPlaybookConfigured()).toBe(false);
    expect(isTsplitsPlaybookPasscode("")).toBe(false);
    expect(isTsplitsPlaybookPasscode("anything")).toBe(false);
    expect(signTsplitsPlaybookCookie()).toBeNull();
    expect(verifyTsplitsPlaybookCookie("v1.1.abc")).toBe(false);
    expect(await redeemTsplitsPlaybookPasscode({ passcode: "anything", ip: "1.2.3.4", userAgent: null })).toEqual({
      error: "unavailable",
    });
  });

  it("checks the passcode exactly", () => {
    process.env[TSPLITS_PLAYBOOK_ENV] = TEST_CODE_A;
    expect(isTsplitsPlaybookPasscode(TEST_CODE_A)).toBe(true);
    expect(isTsplitsPlaybookPasscode(TEST_CODE_B)).toBe(false);
    expect(isTsplitsPlaybookPasscode("")).toBe(false);
    expect(isTsplitsPlaybookPasscode(undefined)).toBe(false);
    expect(isTsplitsPlaybookPasscode(42)).toBe(false);
  });

  it("signs and verifies a 12-hour cookie", () => {
    process.env[TSPLITS_PLAYBOOK_ENV] = TEST_CODE_A;
    const now = Date.now();
    const cookie = signTsplitsPlaybookCookie(now)!;
    expect(cookie).toMatch(/^v1\.\d+\.[0-9a-f]{64}$/);
    expect(verifyTsplitsPlaybookCookie(cookie, now)).toBe(true);
    expect(verifyTsplitsPlaybookCookie(cookie, now + 12 * 3600 * 1000 + 1)).toBe(false);
    const opts = tsplitsPlaybookCookieOptions();
    expect(opts).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", maxAge: 43200 });
  });

  it("rejects tampered cookies and cookies from an old passcode", () => {
    process.env[TSPLITS_PLAYBOOK_ENV] = TEST_CODE_A;
    const cookie = signTsplitsPlaybookCookie()!;
    const [v, exp, mac] = cookie.split(".");
    const flipped = (mac![0] === "a" ? "b" : "a") + mac!.slice(1);
    expect(verifyTsplitsPlaybookCookie(`${v}.${exp}.${flipped}`)).toBe(false);
    expect(verifyTsplitsPlaybookCookie(`${v}.${Number(exp) + 1000}.${mac}`)).toBe(false);
    expect(verifyTsplitsPlaybookCookie("garbage")).toBe(false);
    process.env[TSPLITS_PLAYBOOK_ENV] = TEST_CODE_B;
    expect(verifyTsplitsPlaybookCookie(cookie)).toBe(false);
  });

  it("rate-limits after 10 failures and logs bad attempts", async () => {
    process.env[TSPLITS_PLAYBOOK_ENV] = TEST_CODE_A;
    expect(await redeemTsplitsPlaybookPasscode({ passcode: TEST_CODE_B, ip: "1.2.3.4", userAgent: null })).toEqual({
      error: "badCode",
    });
    expect(failures.inserts).toHaveLength(1);
    const ok = await redeemTsplitsPlaybookPasscode({ passcode: TEST_CODE_A, ip: "1.2.3.4", userAgent: null });
    expect("cookie" in ok && verifyTsplitsPlaybookCookie(ok.cookie)).toBe(true);
    failures.count = 10;
    expect(await redeemTsplitsPlaybookPasscode({ passcode: TEST_CODE_A, ip: "1.2.3.4", userAgent: null })).toEqual({
      error: "tooMany",
    });
  });

  it("keeps the playbook files private and bundled", () => {
    expect(existsSync(join(ROOT, "private/tsplits/tsplits-sales-playbook.html"))).toBe(true);
    expect(existsSync(join(ROOT, "private/tsplits/Tsplits-Sales-Playbook.pdf"))).toBe(true);
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : [n];
      });
    const pub = walk(join(ROOT, "public")).map((n) => n.toLowerCase());
    expect(pub.some((n) => n.includes("playbook") && (n.endsWith(".pdf") || n.endsWith(".html")))).toBe(false);
    const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");
    expect(config).toContain('"/api/tsplits-playbook/**": ["./private/tsplits/**/*"]');
    expect(config).toMatch(/source: "\/talisu\/tsplits-playbook"[\s\S]{0,200}X-Robots-Tag/);
  });

  it("is not linked from navigation or other pages", () => {
    expect(TSPLITS_PLAYBOOK_PATH).toBe("/talisu/tsplits-playbook");
    const hits: string[] = [];
    const scan = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) scan(p);
        else if (/\.(tsx?|json)$/.test(n) && /["'`]\/talisu\/tsplits-playbook["'`?#]/.test(readFileSync(p, "utf8"))) hits.push(p);
      }
    };
    ["app", "components", "lib/i18n"].forEach((d) => existsSync(join(ROOT, d)) && scan(join(ROOT, d)));
    const allowed = ["app/talisu/tsplits-playbook/page.tsx", "app/api/tsplits-playbook/"];
    expect(hits.filter((h) => !allowed.some((a) => h.includes(a)))).toEqual([]);
  });

  it("has neutral EN/DE copy", () => {
    expect(TSPLITS_PLAYBOOK_COPY.en.title).toBe("Tsplits™ Sales Playbook");
    expect(TSPLITS_PLAYBOOK_COPY.de.title).toBe("Tsplits™ Sales Playbook");
    expect(TSPLITS_PLAYBOOK_COPY.en.unavailable).toBe("Access is not available right now.");
    for (const v of [...Object.values(TSPLITS_PLAYBOOK_COPY.en), ...Object.values(TSPLITS_PLAYBOOK_COPY.de)]) {
      expect(String(v)).not.toMatch(/TODO|placeholder|TSPLITS_PLAYBOOK_PASSCODE|env/i);
    }
  });
});
