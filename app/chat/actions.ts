"use server";

import { canManageMapSiteEbooks } from "@/lib/mapsite-edit-auth";
import { getChatIdentity } from "@/lib/chat/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getTalisBooksBookshelf } from "@/lib/talisbooks/library/bookshelf-service";

type Fail = { ok: false; error: string };

function cleanFastCode(raw: unknown): string | null {
  const fc = String(raw ?? "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{1,40}$/.test(fc) ? fc : null;
}

async function authorize(raw: unknown): Promise<{ fastCode: string } | Fail> {
  const me = await getChatIdentity();
  if (!me) return { ok: false, error: "Please sign in again." };
  const fastCode = cleanFastCode(raw);
  if (!fastCode) return { ok: false, error: "Enter a valid FAST Code." };
  if (!(await canManageMapSiteEbooks(fastCode).catch(() => false))) {
    return { ok: false, error: "You don't have eBook access for that FAST Code." };
  }
  return { fastCode };
}

/** FAST Codes this person can pick eBooks from (agents: their assigned Mapsites). */
export async function chatEbookFastCodesAction(): Promise<{ ok: true; codes: string[]; any: boolean } | Fail> {
  const me = await getChatIdentity();
  if (!me) return { ok: false, error: "Please sign in again." };
  if (me.kind === "admin") return { ok: true, codes: [], any: true };
  const scopes = me.account.scopes ?? [];
  const canEbooks = scopes.includes("ebooks") || scopes.includes("mapsites");
  if (!canEbooks) return { ok: true, codes: [], any: false };
  const assigned = (me.account.assignedMapSites ?? []).map((c) => c.toLowerCase());
  return { ok: true, codes: assigned, any: assigned.length === 0 };
}

export async function chatEbookListAction(fastCode: string): Promise<{ ok: true; fastCode: string; books: Array<{ id: string; title: string; coverImageUrl: string | null }> } | Fail> {
  const auth = await authorize(fastCode);
  if ("ok" in auth) return auth;
  const shelf = await getTalisBooksBookshelf({ fastCode: auth.fastCode });
  const books = shelf.books
    .filter((b) => !b.decorative && /^[0-9a-f-]{36}$/i.test(b.id))
    .map((b) => ({ id: b.id, title: b.title || "Untitled", coverImageUrl: b.coverImageUrl ?? null }));
  return { ok: true, fastCode: auth.fastCode, books };
}

/** Mapsite id needed by the shared eBook editor (image uploads). */
export async function chatEbookContextAction(fastCode: string): Promise<{ ok: true; mapsiteId: string } | Fail> {
  const auth = await authorize(fastCode);
  if ("ok" in auth) return auth;
  const { data } = await getSupabaseAdmin().from("mapsites").select("id, fast_code").ilike("fast_code", auth.fastCode).limit(1).maybeSingle();
  const row = data as { id: string } | null;
  return row ? { ok: true, mapsiteId: row.id } : { ok: false, error: "Mapsite not found for that FAST Code." };
}
