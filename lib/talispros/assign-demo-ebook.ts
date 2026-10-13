/**
 * ASSIGN TO ACCOUNT: move the eBook(s) of a demonstration Mapsite onto an
 * existing, paid-up account (FAST Code). Principle: every eBook is a Demo
 * until CLAIMED or ASSIGNED. Paid up = completed Stripe / PayPal payment or a
 * recorded cash payment (all land in talispros_payments as completed).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isDemonstrationListing, isProtectedPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";

export type AssignDemoEbookActor = { label: string; kind: "admin" | "agent" | "owner" };

export type AssignDemoEbookResult =
  | { ok: true; fastCode: string; href: string; moved: number }
  | { ok: false; reason: "not_paid" | "not_found" | "not_demo" | "no_books" | "invalid" | "error"; error: string };

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export function normalizeAssignFastCode(raw: string | null | undefined): string | null {
  const v = String(raw ?? "").trim();
  if (!v || v.length > 32 || !/^[A-Za-z0-9-]+$/.test(v)) return null;
  return v.toLowerCase();
}

export async function assignDemoEbookToAccount(input: {
  mapsiteId: string;
  fastCode: string;
  actor: AssignDemoEbookActor;
}): Promise<AssignDemoEbookResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, reason: "error", error: "Storage is not configured." };
  const code = normalizeAssignFastCode(input.fastCode);
  const mapsiteId = input.mapsiteId?.trim();
  if (!code || !mapsiteId) return { ok: false, reason: "invalid", error: "Enter a valid FAST Code." };
  if (isProtectedPlatformDemoMapSite(mapsiteId)) {
    return { ok: false, reason: "not_demo", error: "The shared platform demo cannot be assigned. Build your own Demo Mapsite first." };
  }
  const client = db();

  const { data: source } = await client
    .from("mapsites")
    .select("id, fast_code, is_demonstration")
    .eq("id", mapsiteId)
    .maybeSingle();
  if (!source || !isDemonstrationListing({ isDemonstration: source.is_demonstration, fastCode: source.fast_code })) {
    return { ok: false, reason: "not_demo", error: "Only demo eBooks can be assigned." };
  }

  const { data: target } = await client
    .from("mapsites")
    .select("id, fast_code, account_type, is_demonstration")
    .ilike("fast_code", code)
    .maybeSingle();
  if (!target?.id || target.is_demonstration) {
    return { ok: false, reason: "not_found", error: "No account found for that FAST Code." };
  }
  const targetCode = String(target.fast_code || code).trim().toLowerCase();

  const paid = await hasCompletedMapSiteActivationPayment({ fastCode: targetCode, reconcileFromStripe: true });
  if (!paid) {
    return {
      ok: false,
      reason: "not_paid",
      error: `${targetCode.toUpperCase()} is not paid up yet. The eBook stays a Demo until the account is paid (card or recorded cash payment).`,
    };
  }

  const sourceCode = String(source.fast_code || "").trim().toLowerCase();
  let query = client.from("talisbooks_books").select("id, slug");
  query = sourceCode
    ? query.or(`mapsite_id.eq.${source.id},fast_code.ilike.${sourceCode}`)
    : query.eq("mapsite_id", source.id);
  const { data: books } = await query;
  if (!books || books.length === 0) {
    return { ok: false, reason: "no_books", error: "This demo has no eBook to assign yet." };
  }

  const now = new Date().toISOString();
  const ids = books.map((b: { id: string }) => b.id);
  const { error: moveError } = await client
    .from("talisbooks_books")
    .update({ fast_code: targetCode, mapsite_id: target.id, updated_at: now })
    .in("id", ids);
  if (moveError) {
    console.error("[assign-demo-ebook] move failed:", moveError.message);
    return { ok: false, reason: "error", error: "Could not assign the eBook. Try again." };
  }

  const { error: logError } = await client.from("ebook_assignments").insert(
    books.map((b: { id: string; slug: string | null }) => ({
      book_id: b.id,
      book_slug: b.slug,
      source_mapsite_id: source.id,
      source_fast_code: sourceCode || null,
      target_mapsite_id: target.id,
      target_fast_code: targetCode,
      assigned_by: input.actor.label,
      assigned_by_kind: input.actor.kind,
    })),
  );
  if (logError) console.error("[assign-demo-ebook] log failed:", logError.message);

  return {
    ok: true,
    fastCode: targetCode,
    moved: ids.length,
    href: buildClaimedMapSitePath({ fastCode: targetCode, accountType: target.account_type }),
  };
}
