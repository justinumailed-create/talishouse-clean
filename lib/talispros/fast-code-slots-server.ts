import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentAgent, type AgentAccount } from "@/lib/agent-collab-server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  FAST_CODE_SLOT_LIMIT,
  SALES_ASSOCIATE_LOGINS,
  ebookLogoFromBookMetadata,
  mapsiteHrefForSlot,
  mapsiteProvinceFromAddress,
  mapsiteTownFromAddress,
  normalizeSlotFastCode,
  pickSlotLogoUrl,
  slotBrokerageName,
  slotInitials,
  sortSlotEntriesNewestFirst,
  type FastCodeSlotsPanelData,
  type OwnSlotList,
  type PublicSlotList,
  type SlotEntry,
} from "@/lib/talispros/fast-code-slots";

/**
 * Server-only access to agent_fast_code_slots (RLS on, no client policies).
 * Public reads return FAST Code, town, province and link, never who prepared it.
 */

const TABLE = "agent_fast_code_slots";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

type MapsiteJoin = {
  id?: string | null;
  property_address?: string | null;
  property_title?: string | null;
  fast_code?: string | null;
  account_type?: string | null;
  created_at?: string | null;
  logo_url?: string | null;
};

type SlotDraft = SlotEntry & { mapsiteId: string; mapsiteLogo: string | null };

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toEntry(slotId: unknown, m: MapsiteJoin | null): SlotDraft | null {
  const code = m?.fast_code?.trim();
  const mapsiteId = m?.id?.trim();
  if (!code || !mapsiteId) return null;
  const town = mapsiteTownFromAddress(m?.property_address, m?.property_title);
  const brokerage = slotBrokerageName(m?.property_title, town);
  return {
    slotId: String(slotId),
    fastCode: code.toUpperCase(),
    town,
    province: mapsiteProvinceFromAddress(m?.property_address),
    href: mapsiteHrefForSlot(m?.account_type, code),
    addedAt: m?.created_at ?? null,
    logoUrl: null,
    initials: slotInitials(brokerage || town, code),
    brokerage,
    mapsiteId,
    mapsiteLogo: m?.logo_url ?? null,
  };
}

function toPublicEntry(draft: SlotDraft, logoUrl: string | null): SlotEntry {
  return {
    slotId: draft.slotId,
    fastCode: draft.fastCode,
    town: draft.town,
    province: draft.province,
    href: draft.href,
    addedAt: draft.addedAt,
    logoUrl,
    initials: draft.initials,
    brokerage: draft.brokerage,
  };
}

type LogoRow = { mapsite_id?: string | null; fast_code?: string | null; logo_url?: string | null };
type BookLogoRow = {
  mapsite_id?: string | null;
  fast_code?: string | null;
  metadata?: unknown;
  updated_at?: string | null;
};

/**
 * Logo & Card Editor override, then the eBook agency logo, then the Mapsite
 * logo. A missing or generic logo stays null so the row can show initials.
 */
async function attachSlotLogos(drafts: SlotDraft[]): Promise<SlotEntry[]> {
  if (!drafts.length) return [];
  const fallback = () => drafts.map((draft) => toPublicEntry(draft, pickSlotLogoUrl([draft.mapsiteLogo])));
  try {
    const ids = [...new Set(drafts.map((draft) => draft.mapsiteId))];
    const codes = [...new Set(drafts.flatMap((draft) => [draft.fastCode, draft.fastCode.toLowerCase()]))];
    const [ownerRes, bookRes] = await Promise.all([
      db().from("mapsite_owner_customizations").select("mapsite_id, fast_code, logo_url").in("mapsite_id", ids),
      db()
        .from("talisbooks_books")
        .select("mapsite_id, fast_code, metadata, updated_at")
        .in("fast_code", codes),
    ]);
    const ownerByMapsite = new Map<string, string>();
    const ownerByCode = new Map<string, string>();
    for (const row of (ownerRes.data || []) as LogoRow[]) {
      const logo = row.logo_url?.trim();
      if (!logo) continue;
      if (row.mapsite_id) ownerByMapsite.set(row.mapsite_id, logo);
      if (row.fast_code) ownerByCode.set(row.fast_code.toLowerCase(), logo);
    }
    const books = [...((bookRes.data || []) as BookLogoRow[])].sort((a, b) => {
      const left = a.updated_at ? Date.parse(a.updated_at) : 0;
      const right = b.updated_at ? Date.parse(b.updated_at) : 0;
      return right - left;
    });
    const ebookByMapsite = new Map<string, string>();
    const ebookByCode = new Map<string, string>();
    for (const book of books) {
      const logo = ebookLogoFromBookMetadata(book.metadata);
      if (!logo) continue;
      if (book.mapsite_id && !ebookByMapsite.has(book.mapsite_id)) ebookByMapsite.set(book.mapsite_id, logo);
      const code = book.fast_code?.trim().toLowerCase();
      if (code && !ebookByCode.has(code)) ebookByCode.set(code, logo);
    }
    return drafts.map((draft) => {
      const code = draft.fastCode.toLowerCase();
      return toPublicEntry(
        draft,
        pickSlotLogoUrl([
          ownerByMapsite.get(draft.mapsiteId),
          ownerByCode.get(code),
          ebookByMapsite.get(draft.mapsiteId),
          ebookByCode.get(code),
          draft.mapsiteLogo,
        ]),
      );
    });
  } catch {
    return fallback();
  }
}

const SLOT_SELECT =
  "id, agent_id, position, created_at, mapsites(id, fast_code, account_type, property_address, property_title, created_at, logo_url)";

/** Public groups: codes, towns and provinces only. The agent's name is never selected. */
async function loadPublicLists(excludeAgentId: string | null): Promise<PublicSlotList[]> {
  const { data: agents } = await db()
    .from("agent_admins")
    .select("id, login_id")
    .in("login_id", [...SALES_ASSOCIATE_LOGINS]);
  const ordered = SALES_ASSOCIATE_LOGINS.map((login) =>
    (agents || []).find((a) => String(a.login_id).toLowerCase() === login),
  ).filter((a): a is { id: string; login_id: string } => Boolean(a) && a!.id !== excludeAgentId);
  if (!ordered.length) return [];

  const { data: slots } = await db()
    .from(TABLE)
    .select(SLOT_SELECT)
    .in("agent_id", ordered.map((a) => a.id))
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const lists = await Promise.all(
    ordered.map(async (agent) => ({
      entries: await attachSlotLogos(
        sortSlotEntriesNewestFirst(
          (slots || [])
            .filter((s) => s.agent_id === agent.id)
            .slice(0, FAST_CODE_SLOT_LIMIT)
            .flatMap((s) => {
              const entry = toEntry(s.id, one(s.mapsites as MapsiteJoin | MapsiteJoin[] | null));
              return entry ? [entry] : [];
            }),
        ),
      ),
    })),
  );
  return lists.filter((list) => list.entries.length > 0);
}

/** One agent's list by id (their own page, and the admin "View as agent" preview). */
export async function loadSlotListForAgentId(agentId: string): Promise<OwnSlotList> {
  if (!isSupabaseAdminConfigured()) return { count: 0, limit: FAST_CODE_SLOT_LIMIT, entries: [] };
  const { data: slots } = await db()
    .from(TABLE)
    .select(SLOT_SELECT)
    .eq("agent_id", agentId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  const entries = await attachSlotLogos(
    sortSlotEntriesNewestFirst(
      (slots || []).flatMap((s) => {
        const entry = toEntry(s.id, one(s.mapsites as MapsiteJoin | MapsiteJoin[] | null));
        return entry ? [entry] : [];
      }),
    ),
  );
  return { count: entries.length, limit: FAST_CODE_SLOT_LIMIT, entries };
}

export async function loadOwnSlotList(agent: AgentAccount): Promise<OwnSlotList> {
  return loadSlotListForAgentId(agent.agentId);
}

/** Panel data for the current request: codes only for the signed-in agent's own list. */
export async function loadFastCodeSlotsPanel(): Promise<FastCodeSlotsPanelData> {
  if (!isSupabaseAdminConfigured()) return { associates: [], own: null };
  const agent = await getCurrentAgent().catch(() => null);
  const [associates, own] = await Promise.all([
    loadPublicLists(agent?.agentId ?? null).catch(() => []),
    agent ? loadOwnSlotList(agent).catch(() => null) : Promise.resolve(null),
  ]);
  return { associates, own };
}

export type SlotMutationError = "signin" | "invalid" | "notFound" | "duplicate" | "full" | "failed";

export async function addFastCodeSlot(
  agent: AgentAccount,
  rawCode: unknown,
): Promise<{ ok: true } | { ok: false; error: SlotMutationError }> {
  const code = normalizeSlotFastCode(rawCode);
  if (!code) return { ok: false, error: "invalid" };
  const { data: mapsite } = await db()
    .from("mapsites")
    .select("id")
    .ilike("fast_code", code)
    .limit(1)
    .maybeSingle();
  if (!mapsite?.id) return { ok: false, error: "notFound" };

  const { data: existing } = await db()
    .from(TABLE)
    .select("id, mapsite_id, position")
    .eq("agent_id", agent.agentId);
  const rows = existing || [];
  if (rows.some((r) => r.mapsite_id === mapsite.id)) return { ok: false, error: "duplicate" };
  if (rows.length >= FAST_CODE_SLOT_LIMIT) return { ok: false, error: "full" };
  const position = rows.reduce((max, r) => Math.max(max, Number(r.position) || 0), -1) + 1;

  const { error } = await db()
    .from(TABLE)
    .insert({ agent_id: agent.agentId, mapsite_id: mapsite.id, position });
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : "failed" };
  return { ok: true };
}

export async function removeFastCodeSlot(
  agent: AgentAccount,
  slotId: unknown,
): Promise<{ ok: true } | { ok: false; error: SlotMutationError }> {
  if (typeof slotId !== "string" || !/^[0-9a-f-]{36}$/i.test(slotId)) return { ok: false, error: "invalid" };
  const { error } = await db().from(TABLE).delete().eq("id", slotId).eq("agent_id", agent.agentId);
  return error ? { ok: false, error: "failed" } : { ok: true };
}

/** Mapsite path for a public town link. Only slots of the listed associates open. */
export async function resolveSlotMapsiteHref(slotId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(slotId) || !isSupabaseAdminConfigured()) return null;
  const { data } = await db()
    .from(TABLE)
    .select("id, agent_id, agent_admins(login_id), mapsites(fast_code, account_type)")
    .eq("id", slotId)
    .maybeSingle();
  if (!data) return null;
  const owner = one(data.agent_admins as { login_id?: string | null } | { login_id?: string | null }[] | null);
  const viewer = await getCurrentAgent().catch(() => null);
  const isAssociate = SALES_ASSOCIATE_LOGINS.includes(
    String(owner?.login_id || "").toLowerCase() as (typeof SALES_ASSOCIATE_LOGINS)[number],
  );
  if (!isAssociate && viewer?.agentId !== data.agent_id) return null;
  const m = one(data.mapsites as MapsiteJoin | MapsiteJoin[] | null);
  const code = m?.fast_code?.trim();
  return code ? mapsiteHrefForSlot(m?.account_type, code) : null;
}

/** True when a sales associate has prepared this Mapsite (shows Aisha's four buttons). */
export async function isPreparedSlotMapsite(mapsiteId: string | null | undefined): Promise<boolean> {
  if (!mapsiteId || !isSupabaseAdminConfigured()) return false;
  const { count } = await db()
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("mapsite_id", mapsiteId);
  return (count ?? 0) > 0;
}

/** Mapsite link for a prepared (slot) FAST Code, or null when the code is not a prospect code. */
export async function resolvePreparedHrefByCode(code: string): Promise<{ href: string; mapsiteId: string } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const { data } = await db()
    .from("mapsites")
    .select("id, fast_code, account_type")
    .ilike("fast_code", code)
    .limit(1)
    .maybeSingle();
  const m = data as { id: string; fast_code: string | null; account_type: string | null } | null;
  if (!m?.fast_code || !(await isPreparedSlotMapsite(m.id))) return null;
  return { href: mapsiteHrefForSlot(m.account_type, m.fast_code), mapsiteId: m.id };
}
