import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

/** Partner-linked Mapsites (migration 103). Pairs stored sorted, lower-case. */
export const MAPSITE_PARTNER_LINKS_TABLE = "mapsite_partner_links";

export type MapSitePartnerLink = {
  id: string;
  fastCodeA: string;
  fastCodeB: string;
  createdAt: string;
  createdBy: string | null;
};

/** Only superadmins may link / unlink partner Mapsites (not "full" admins). */
export function canLinkMapSitePartners(access: string | null | undefined): boolean {
  return access === "superadmin";
}

export function normalizePartnerFastCode(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

/** Sorted pair so (a,b) and (b,a) are the same link. */
export function sortPartnerPair(a: string, b: string): [string, string] {
  const x = normalizePartnerFastCode(a);
  const y = normalizePartnerFastCode(b);
  return x < y ? [x, y] : [y, x];
}

/** Other FAST Codes linked to `fastCode`, from a list of links. */
export function partnersFromLinks(
  links: readonly Pick<MapSitePartnerLink, "fastCodeA" | "fastCodeB">[],
  fastCode: string,
): string[] {
  const code = normalizePartnerFastCode(fastCode);
  const out = new Set<string>();
  for (const link of links) {
    if (link.fastCodeA === code) out.add(link.fastCodeB);
    else if (link.fastCodeB === code) out.add(link.fastCodeA);
  }
  return [...out].sort();
}

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

type Row = {
  id: string;
  fast_code_a: string;
  fast_code_b: string;
  created_at: string;
  created_by: string | null;
};

function toLink(row: Row): MapSitePartnerLink {
  return {
    id: row.id,
    fastCodeA: row.fast_code_a,
    fastCodeB: row.fast_code_b,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function listMapSitePartnerLinks(): Promise<MapSitePartnerLink[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data, error } = await db()
    .from(MAPSITE_PARTNER_LINKS_TABLE)
    .select("id, fast_code_a, fast_code_b, created_at, created_by")
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data || []) as Row[]).map(toLink);
}

/** Partner FAST Codes for one Mapsite (empty on any error / missing table). */
export async function listMapSitePartnerCodes(fastCode: string): Promise<string[]> {
  const code = normalizePartnerFastCode(fastCode);
  if (!code || !isSupabaseAdminConfigured()) return [];
  try {
    const { data, error } = await db()
      .from(MAPSITE_PARTNER_LINKS_TABLE)
      .select("fast_code_a, fast_code_b")
      .or(`fast_code_a.eq.${code},fast_code_b.eq.${code}`);
    if (error) return [];
    return partnersFromLinks(
      ((data || []) as Pick<Row, "fast_code_a" | "fast_code_b">[]).map((r) => ({
        fastCodeA: r.fast_code_a,
        fastCodeB: r.fast_code_b,
      })),
      code,
    );
  } catch {
    return [];
  }
}

export async function insertMapSitePartnerLink(
  a: string,
  b: string,
  createdBy: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [x, y] = sortPartnerPair(a, b);
  if (!x || !y) return { ok: false, error: "Enter two FAST Codes." };
  if (x === y) return { ok: false, error: "A Mapsite cannot be linked to itself." };
  const { error } = await db()
    .from(MAPSITE_PARTNER_LINKS_TABLE)
    .insert({ fast_code_a: x, fast_code_b: y, created_by: createdBy });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "These Mapsites are already linked." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteMapSitePartnerLink(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db().from(MAPSITE_PARTNER_LINKS_TABLE).delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
