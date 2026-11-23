import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { tryGetSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Built Mapsites on the TalisU Markets admin map (Ralf, Nov 23): every real
 * (non-demonstration) Mapsite with a Home PIN, so success shows at a glance.
 * Each PIN links to its Mapsite account (/admin/mapsites/<FAST Code>) and,
 * when the owner's email matches a CRM lead, to that CRM / CSV record.
 *
 * Read-only: existing `mapsites` and `brokerage_leads` tables, no writes.
 */

export type MarketsMapsitePin = {
  id: string;
  fastCode: string;
  title: string;
  owner: string;
  accountType: string;
  address: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: string | null;
  accountHref: string;
  /** CRM record when the owner's email matches a lead, else a CRM search. */
  crmHref: string;
  crmMatched: boolean;
};

type MapsiteRow = {
  id: string;
  fast_code: string | null;
  status: string | null;
  property_title: string | null;
  property_address: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  email: string | null;
  account_type: string | null;
  is_demonstration: boolean | null;
  latitude: number | string | null;
  longitude: number | string | null;
  created_at: string | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function crmSearchHref(query: string): string {
  const params = new URLSearchParams({ scope: "all" });
  if (query) params.set("q", query);
  return `/admin/agent/leads?${params.toString()}`;
}

/** Pure mapping, kept separate so it can be tested without a database. */
export function toMarketsMapsitePins(
  rows: readonly MapsiteRow[],
  leadIdByEmail: ReadonlyMap<string, string>,
): MarketsMapsitePin[] {
  const pins: MarketsMapsitePin[] = [];
  for (const row of rows) {
    if (row.is_demonstration) continue;
    const fastCode = (row.fast_code ?? "").trim();
    const latitude = toNumber(row.latitude);
    const longitude = toNumber(row.longitude);
    if (!fastCode || latitude === null || longitude === null) continue;
    if (latitude === 0 && longitude === 0) continue;
    const email = normalizeEmail(row.email);
    const leadId = email ? leadIdByEmail.get(email) : undefined;
    const owner = [row.owner_first_name, row.owner_last_name].map((part) => (part ?? "").trim()).filter(Boolean).join(" ");
    pins.push({
      id: row.id,
      fastCode,
      title: (row.property_title ?? "").trim() || owner || fastCode,
      owner,
      accountType: (row.account_type ?? "").trim(),
      address: (row.property_address ?? "").trim(),
      status: (row.status ?? "").trim() || "active",
      latitude,
      longitude,
      createdAt: row.created_at,
      accountHref: `/admin/mapsites/${encodeURIComponent(fastCode)}`,
      crmHref: leadId ? `/admin/agent/leads/${encodeURIComponent(leadId)}` : crmSearchHref(email || fastCode),
      crmMatched: Boolean(leadId),
    });
  }
  return pins;
}

export async function listMarketsMapsitePins(): Promise<MarketsMapsitePin[]> {
  const admin = tryGetSupabaseAdmin() as unknown as SupabaseClient | null;
  if (!admin) return [];
  const { data, error } = await admin
    .from("mapsites")
    .select(
      "id, fast_code, status, property_title, property_address, owner_first_name, owner_last_name, email, account_type, is_demonstration, latitude, longitude, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error || !data) return [];
  const rows = data as MapsiteRow[];

  const emails = [...new Set(rows.map((row) => normalizeEmail(row.email)).filter(Boolean))];
  const leadIdByEmail = new Map<string, string>();
  for (let start = 0; start < emails.length; start += 200) {
    const chunk = emails.slice(start, start + 200);
    const { data: leads } = await admin
      .from("brokerage_leads")
      .select("id, email_normalized")
      .in("email_normalized", chunk);
    for (const lead of (leads ?? []) as { id: string; email_normalized: string | null }[]) {
      const key = normalizeEmail(lead.email_normalized);
      if (key && !leadIdByEmail.has(key)) leadIdByEmail.set(key, lead.id);
    }
  }
  return toMarketsMapsitePins(rows, leadIdByEmail);
}
