import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ rows: [] as unknown[], error: null as null | { message: string } }));
vi.mock("@/lib/supabaseAdmin", () => ({
  tryGetSupabaseAdmin: () => ({
    from: (table: string) => ({
      insert: async (rows: unknown[]) => {
        env.rows.push({ table, rows });
        return { error: env.error };
      },
    }),
  }),
}));

import { submitProposalAction } from "../app/business-office/apply/actions";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

describe("Propose a Project (Oct 31 redesign)", () => {
  beforeEach(() => {
    env.rows = [];
    env.error = null;
  });

  it("writes only existing applications columns, server-side", async () => {
    const res = await submitProposalAction({
      name: " Pat Lee ",
      email: "pat@example.com",
      phone: "",
      location: "Toronto, ON",
      role: "resale",
    });
    expect(res).toEqual({ ok: true });
    expect(env.rows).toEqual([
      {
        table: "applications",
        rows: [{ name: "Pat Lee", email: "pat@example.com", phone: null, location: "Toronto, ON", participation_level: "resale", status: "pending" }],
      },
    ]);
  });

  it("rejects missing fields, bad emails and unknown roles, and hides DB errors", async () => {
    const base = { name: "A", email: "a@b.co", location: "X", role: "referral" };
    expect(await submitProposalAction({ ...base, name: " " })).toEqual({ ok: false, error: "required" });
    expect(await submitProposalAction({ ...base, role: "admin" })).toEqual({ ok: false, error: "required" });
    expect(await submitProposalAction({ ...base, email: "nope" })).toEqual({ ok: false, error: "badEmail" });
    env.error = { message: "column x" };
    expect(await submitProposalAction(base)).toEqual({ ok: false, error: "failed" });
  });

  it("is one clean column with a single primary button, EN/DE, no dev text", () => {
    const ui = readFileSync(resolve("app/business-office/apply/ApplyClient.tsx"), "utf8");
    expect(ui).not.toMatch(/console\.|placeholder=|lead_capture|John Doe|supabase/);
    expect(ui.match(/type="submit"/g)).toHaveLength(1);
    expect(ui).toContain("max-w-[560px]");
    expect(en.propose.title).toBe("Propose a Project.");
    expect(de.propose.title).toBe("Projekt vorschlagen.");
    expect(JSON.stringify([en.propose, de.propose])).not.toMatch(/TODO|TBD|USD|lorem/i);
  });

  it("is linked from Webster's Value-Added page", () => {
    const page = readFileSync(resolve("app/talisu/value-added/page.tsx"), "utf8");
    expect(page).toContain("ROUTES.BUSINESS_OFFICE_APPLY");
    expect(en.talisu.valueAdded.proposeCta).toBe("Propose a Project");
    expect(de.talisu.valueAdded.proposeCta).toBe("Projekt vorschlagen");
  });
});
