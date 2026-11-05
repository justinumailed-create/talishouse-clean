"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminScope } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { runFastCodeDailyJob, type DailyJobSummary } from "@/lib/talispros/fast-code-daily-job";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

/** "Run now" on the admin tracker: same job as the 06:00 IST cron. */
export async function runFastCodeJobNowAction(): Promise<{ ok: true; summary: DailyJobSummary } | { ok: false }> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false };
  const summary = await runFastCodeDailyJob(`admin:${account.name}`);
  revalidatePath("/admin/dashboard");
  return { ok: true, summary };
}

function clean(v: FormDataEntryValue | null, max = 300): string | null {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
}

/** Add a researched brokerage to the review queue. A public source link is required. */
export async function addProspectToQueueAction(form: FormData): Promise<void> {
  const account = await requireAdminScope("agents");
  const brokerage = clean(form.get("brokerage"), 160);
  const source = clean(form.get("source_url"), 500);
  const province = clean(form.get("province"), 40);
  if (!brokerage || !source || !/^https:\/\//i.test(source)) return;
  if (province && /^(ns|nova scotia)$/i.test(province)) return; // Ralf: outside Nova Scotia only.
  await db().from("prospect_queue").insert({
    brokerage,
    contact_name: clean(form.get("contact_name"), 120),
    office_address: clean(form.get("office_address"), 200),
    town: clean(form.get("town"), 80),
    province,
    website: clean(form.get("website"), 300),
    source_url: source,
    research_notes: clean(form.get("research_notes"), 1000),
    reviewed_by: null,
  });
  void account;
  revalidatePath("/admin/dashboard");
}

/** Approve or reject a queued prospect. Approved ones are coded and assigned by the daily job (or Run now). */
export async function reviewProspectAction(form: FormData): Promise<void> {
  const account = await requireAdminScope("agents");
  const id = clean(form.get("id"), 40);
  const decision = clean(form.get("decision"), 10);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || (decision !== "approved" && decision !== "rejected")) return;
  const { data } = await db()
    .from("prospect_queue")
    .update({ status: decision, reviewed_by: account.name, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("brokerage")
    .maybeSingle();
  void data;
  revalidatePath("/admin/dashboard");
}
