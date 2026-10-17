import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  claimedMapSiteSegmentForAccountOrPlan,
  buildClaimedMapSitePath,
} from "@/lib/talispros/mapsite-state";
import { normalizeCustomPinCategories } from "@/lib/talispros/mapsite-pin-categories";
import {
  otherSideOfLink,
  partnerRelation,
  rootOfDerivative,
  rootPartnerAddError,
  type MapSitePartnerLinkRow,
  type MapSitePartnerPin,
  type MapSitePlanRole,
  type MapSiteRootPartner,
} from "@/lib/talispros/mapsite-root-partners";
import { sortPartnerPair } from "@/lib/talispros/mapsite-partner-links";

const LINKS = "mapsite_partner_links";
const CATEGORIES = "mapsite_pin_categories";
const PAID = new Set(["completed", "paid", "complete", "succeeded"]);

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function norm(code: string | null | undefined): string {
  return (code || "").trim().toLowerCase();
}

type MapSiteLite = {
  id: string;
  fastCode: string;
  accountType: string;
  title: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pinCategory: string | null;
};

async function readMapSitesByCodes(codes: string[]): Promise<MapSiteLite[]> {
  const list = [...new Set(codes.map(norm).filter(Boolean))];
  if (list.length === 0) return [];
  const { data, error } = await db()
    .from("mapsites")
    .select("id, fast_code, account_type, property_title, property_address, latitude, longitude, pin_category, updated_at")
    .in("fast_code", [...list, ...list.map((c) => c.toUpperCase())])
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  const seen = new Set<string>();
  const out: MapSiteLite[] = [];
  for (const row of data as Array<Record<string, unknown>>) {
    const code = norm(row.fast_code as string);
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      id: row.id as string,
      fastCode: code,
      accountType: (row.account_type as string) || "",
      title: (row.property_title as string | null) ?? null,
      address: (row.property_address as string | null) ?? null,
      latitude: (row.latitude as number | null) ?? null,
      longitude: (row.longitude as number | null) ?? null,
      pinCategory: (row.pin_category as string | null) ?? null,
    });
  }
  return out;
}

async function paidPlanType(fastCode: string, mapsiteId: string | null): Promise<string | null> {
  const queries = [
    mapsiteId
      ? db().from("talispros_payments").select("plan_type, payment_status").eq("mapsite_id", mapsiteId).order("created_at", { ascending: false }).limit(5)
      : null,
    db().from("talispros_payments").select("plan_type, payment_status").ilike("fast_code", fastCode).order("created_at", { ascending: false }).limit(5),
  ];
  for (const query of queries) {
    if (!query) continue;
    const { data } = await query;
    for (const row of (data || []) as Array<{ plan_type: string | null; payment_status: string | null }>) {
      if (row.plan_type && PAID.has((row.payment_status || "").trim().toLowerCase())) {
        return row.plan_type;
      }
    }
  }
  return null;
}

/** Root (paid Root Account / root mapsite), Derivative, or other. */
export async function resolveMapSitePlanRole(input: {
  fastCode: string;
  mapsiteId?: string | null;
  accountType?: string | null;
}): Promise<MapSitePlanRole> {
  const code = norm(input.fastCode);
  if (!code || !isSupabaseAdminConfigured()) return "other";
  try {
    const plan = await paidPlanType(code, input.mapsiteId ?? null);
    const value = (plan || input.accountType || "").trim().toLowerCase();
    if (value.includes("derivative")) return "derivative";
    if (value && claimedMapSiteSegmentForAccountOrPlan(value) === "brokers") return "root";
    return "other";
  } catch {
    return "other";
  }
}

async function listLinksFor(codes: string[]): Promise<MapSitePartnerLinkRow[]> {
  const list = [...new Set(codes.map(norm).filter(Boolean))];
  if (list.length === 0) return [];
  const or = list.map((c) => `fast_code_a.eq.${c},fast_code_b.eq.${c}`).join(",");
  const { data, error } = await db()
    .from(LINKS)
    .select("id, fast_code_a, fast_code_b, root_fast_code")
    .or(or);
  if (error || !data) return [];
  return (data as Array<Record<string, string | null>>).map((r) => ({
    id: r.id as string,
    fastCodeA: r.fast_code_a as string,
    fastCodeB: r.fast_code_b as string,
    rootFastCode: r.root_fast_code ?? null,
  }));
}

export async function loadOwnCustomPinCategories(mapsiteId: string): Promise<string[]> {
  if (!mapsiteId || !isSupabaseAdminConfigured()) return [];
  try {
    const { data } = await db()
      .from(CATEGORIES)
      .select("custom_categories")
      .eq("mapsite_id", mapsiteId)
      .maybeSingle();
    return normalizeCustomPinCategories((data as { custom_categories?: unknown } | null)?.custom_categories);
  } catch {
    return [];
  }
}

/** Categories that apply to a Mapsite's PINs: its Root's when it is a linked Derivative. */
export async function loadEffectiveCustomPinCategories(input: {
  mapsiteId: string;
  fastCode: string;
}): Promise<{ categories: string[]; rootFastCode: string | null }> {
  const links = await listLinksFor([input.fastCode]).catch(() => []);
  const rootFastCode = rootOfDerivative(links, input.fastCode);
  if (!rootFastCode) {
    return { categories: await loadOwnCustomPinCategories(input.mapsiteId), rootFastCode: null };
  }
  const [root] = await readMapSitesByCodes([rootFastCode]);
  return {
    categories: root ? await loadOwnCustomPinCategories(root.id) : [],
    rootFastCode,
  };
}

export type MapSiteRootContext = {
  role: MapSitePlanRole;
  mainPinCategory: string | null;
  /** Categories for this Mapsite's PINs (its Root's when a linked Derivative). */
  customCategories: string[];
  /** This Mapsite's own list (editable only when it is not a linked Derivative). */
  ownCustomCategories: string[];
  rootFastCode: string | null;
  partners: MapSiteRootPartner[];
  /** Derivative holders' PINs, shown on a Root's map. */
  partnerPins: MapSitePartnerPin[];
};

export function emptyMapSiteRootContext(): MapSiteRootContext {
  return {
    role: "other",
    mainPinCategory: null,
    customCategories: [],
    ownCustomCategories: [],
    rootFastCode: null,
    partners: [],
    partnerPins: [],
  };
}

export async function loadMapSiteRootContext(input: {
  mapsiteId: string;
  fastCode: string;
}): Promise<MapSiteRootContext> {
  const code = norm(input.fastCode);
  if (!code || !input.mapsiteId || !isSupabaseAdminConfigured()) return emptyMapSiteRootContext();
  try {
    const [links, self] = await Promise.all([listLinksFor([code]), readMapSitesByCodes([code])]);
    const me = self[0];
    const role = await resolveMapSitePlanRole({
      fastCode: code,
      mapsiteId: input.mapsiteId,
      accountType: me?.accountType,
    });
    const rootFastCode = rootOfDerivative(links, code);
    const partnerCodes = links.map((l) => otherSideOfLink(l, code));
    const partnerSites = await readMapSitesByCodes(partnerCodes);
    const byCode = new Map(partnerSites.map((s) => [s.fastCode, s]));

    const partners: MapSiteRootPartner[] = [];
    for (const link of links) {
      const other = otherSideOfLink(link, code);
      const site = byCode.get(other);
      const relation = partnerRelation(link, code);
      const segment = site
        ? claimedMapSiteSegmentForAccountOrPlan(
            (await paidPlanType(other, site.id).catch(() => null)) || site.accountType,
          )
        : "listings";
      partners.push({
        linkId: link.id,
        fastCode: other,
        title: site?.title ?? null,
        href: buildClaimedMapSitePath({ fastCode: other, accountType: segment }),
        relation,
      });
    }

    // Root map: every Derivative holder's PINs (main + additional).
    const derivatives = partners.filter((p) => p.relation === "derivative");
    const partnerPins: MapSitePartnerPin[] = [];
    if (derivatives.length > 0) {
      const sites = derivatives
        .map((p) => ({ partner: p, site: byCode.get(p.fastCode) }))
        .filter((x): x is { partner: MapSiteRootPartner; site: MapSiteLite } => Boolean(x.site));
      const ids = sites.map((x) => x.site.id);
      const { data: extra } = ids.length
        ? await db()
            .from("mapsite_additional_pins")
            .select("id, mapsite_id, latitude, longitude, label, category, sort_order")
            .in("mapsite_id", ids)
            .order("sort_order", { ascending: true })
        : { data: [] };
      for (const { partner, site } of sites) {
        const upper = partner.fastCode.toUpperCase();
        if (site.latitude != null && site.longitude != null) {
          partnerPins.push({
            id: `partner:${site.id}`,
            fastCode: partner.fastCode,
            latitude: site.latitude,
            longitude: site.longitude,
            label: `${upper} · ${site.title || site.address || upper}`,
            category: site.pinCategory,
            href: partner.href,
          });
        }
        for (const pin of (extra || []) as Array<Record<string, unknown>>) {
          if (pin.mapsite_id !== site.id) continue;
          partnerPins.push({
            id: `partner:${pin.id as string}`,
            fastCode: partner.fastCode,
            latitude: pin.latitude as number,
            longitude: pin.longitude as number,
            label: `${upper} · ${(pin.label as string) || "PIN"}`,
            category: (pin.category as string | null) ?? null,
            href: partner.href,
          });
        }
      }
    }

    const ownCustomCategories = await loadOwnCustomPinCategories(input.mapsiteId);
    let customCategories = ownCustomCategories;
    if (rootFastCode) {
      const [root] = await readMapSitesByCodes([rootFastCode]);
      customCategories = root ? await loadOwnCustomPinCategories(root.id) : [];
    }

    return {
      role,
      mainPinCategory: me?.pinCategory ?? null,
      customCategories,
      ownCustomCategories,
      rootFastCode,
      partners,
      partnerPins,
    };
  } catch (error) {
    console.warn("[mapsite-root-partners] load failed:", error);
    return emptyMapSiteRootContext();
  }
}

export async function addRootPartnerLink(input: {
  rootFastCode: string;
  candidateFastCode: string;
  createdBy: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const root = norm(input.rootFastCode);
  const candidate = norm(input.candidateFastCode).replace(/^fast\s*code[:\s]*/i, "");
  const [site] = candidate ? await readMapSitesByCodes([candidate]) : [];
  const links = candidate ? await listLinksFor([candidate]) : [];
  const role = site
    ? await resolveMapSitePlanRole({ fastCode: candidate, mapsiteId: site.id, accountType: site.accountType })
    : "other";
  const [a, b] = sortPartnerPair(root, candidate);
  const existing = links.find((l) => l.fastCodeA === a && l.fastCodeB === b);
  const error = rootPartnerAddError({
    rootFastCode: root,
    candidateFastCode: candidate,
    candidateExists: Boolean(site),
    candidateRole: role,
    candidateRoot: rootOfDerivative(links, candidate),
    alreadyLinked: Boolean(existing?.rootFastCode === root),
  });
  if (error) return { ok: false, error };
  if (existing) {
    // An admin-made plain pair becomes a Root → Derivative link.
    const { error: updateError } = await db()
      .from(LINKS)
      .update({ root_fast_code: root })
      .eq("id", existing.id);
    if (updateError) return { ok: false, error: "Could not add that Partner Mapsite." };
    return { ok: true };
  }
  const { error: insertError } = await db()
    .from(LINKS)
    .insert({ fast_code_a: a, fast_code_b: b, root_fast_code: root, created_by: input.createdBy });
  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "That Mapsite is already a Partner Mapsite of another Root Account." };
    }
    return { ok: false, error: "Could not add that Partner Mapsite." };
  }
  return { ok: true };
}

/** A Root removes one of its own Derivative links (never someone else's). */
export async function removeRootPartnerLink(input: {
  rootFastCode: string;
  linkId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await db()
    .from(LINKS)
    .delete()
    .eq("id", input.linkId)
    .eq("root_fast_code", norm(input.rootFastCode))
    .select("id");
  if (error) return { ok: false, error: "Could not remove that Partner Mapsite." };
  if (!data || data.length === 0) return { ok: false, error: "That Partner Mapsite was not found." };
  return { ok: true };
}

export async function saveOwnCustomPinCategories(input: {
  mapsiteId: string;
  fastCode: string;
  categories: string[];
}): Promise<{ ok: true; categories: string[] } | { ok: false; error: string }> {
  const categories = normalizeCustomPinCategories(input.categories);
  const { error } = await db()
    .from(CATEGORIES)
    .upsert(
      {
        mapsite_id: input.mapsiteId,
        fast_code: norm(input.fastCode),
        custom_categories: categories,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mapsite_id" },
    );
  if (error) return { ok: false, error: "Could not save categories." };
  return { ok: true, categories };
}

export async function saveMainPinCategory(input: {
  mapsiteId: string;
  category: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db()
    .from("mapsites")
    .update({ pin_category: input.category })
    .eq("id", input.mapsiteId);
  return error ? { ok: false, error: "Could not save the category." } : { ok: true };
}
