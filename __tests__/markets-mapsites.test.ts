import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAdmin", () => ({ tryGetSupabaseAdmin: () => null }));

import { toMarketsMapsitePins, crmSearchHref } from "@/lib/talisu/markets-mapsites.server";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";

const row = (over: Record<string, unknown>) => ({
  id: "m1",
  fast_code: "ABC123",
  status: "active",
  property_title: "Sam's Realty",
  property_address: "Moncton, NB",
  owner_first_name: "Sam",
  owner_last_name: "Lee",
  email: "Sam@Example.com",
  account_type: "broker",
  is_demonstration: false,
  latitude: 46.08,
  longitude: -64.78,
  created_at: "2026-11-23T07:00:00Z",
  ...over,
});

describe("Markets → Mapsites Built (Ralf, Nov 23)", () => {
  it("maps real Mapsites with a Home PIN to account and CRM links", () => {
    const pins = toMarketsMapsitePins(
      [
        row({}),
        row({ id: "demo", is_demonstration: true }),
        row({ id: "nocoords", latitude: null }),
        row({ id: "m2", fast_code: "XYZ", email: "nobody@example.com", latitude: "45.5", longitude: "-73.6" }),
      ] as never,
      new Map([["sam@example.com", "lead-1"]]),
    );
    expect(pins.map((pin) => pin.id)).toEqual(["m1", "m2"]);
    expect(pins[0]!.accountHref).toBe("/admin/mapsites/ABC123");
    expect(pins[0]!.crmHref).toBe("/admin/agent/leads/lead-1");
    expect(pins[0]!.crmMatched).toBe(true);
    expect(pins[1]!.crmHref).toBe(crmSearchHref("nobody@example.com"));
    expect(pins[1]!.latitude).toBe(45.5);
  });

  it("is gated like the other Markets maps and reads only", () => {
    const page = readFileSync(resolve("app/markets/mapsites/page.tsx"), "utf8");
    expect(page).toContain("getAdminSessionAccount");
    expect(page).toContain("<MarketsAdminGate />");
    const server = readFileSync(resolve("lib/talisu/markets-mapsites.server.ts"), "utf8");
    expect(server).not.toMatch(/\.(insert|update|upsert|delete)\(/);
    expect(en.markets.built.title).toBe("Mapsites Built");
    expect(de.markets.built.title).toBe("Erstellte Mapsites");
  });
});
