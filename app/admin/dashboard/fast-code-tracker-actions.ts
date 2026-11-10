"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminScope } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { assignApproved, loadTakenCodes, runFastCodeDailyJob, type DailyJobSummary } from "@/lib/talispros/fast-code-daily-job";
import {
  displayContactName,
  personNamePartsFromFirstLast,
  proposeFastCodeFromParts,
} from "@/lib/talispros/fast-code-tracker";
import { countryFromRegion, partitionReview, type ApprovalLead } from "@/lib/talispros/prospect-approval";
import { markAdminTalisbotMessageRead } from "@/lib/talispros/admin-talisbot-messages";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";
import {
  importProspectContactsCsv,
  type ProspectImportReport,
} from "@/lib/talispros/prospect-contacts-import";
import {
  assignedCopy,
  contactResultCopy,
  postTalisbotCard,
} from "@/lib/talispros/admin-talisbot-messages";

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

  const first = clean(form.get("contact_first_name"), 80);
  const last = clean(form.get("contact_last_name"), 80);
  const parts = personNamePartsFromFirstLast(first, last);
  const contactName = parts ? displayContactName(parts) : clean(form.get("contact_name"), 120);
  let proposed: string | null = null;
  if (parts) {
    const taken = await loadTakenCodes();
    proposed = proposeFastCodeFromParts(first, last, taken);
  }

  const inserted = {
    brokerage,
    contact_name: contactName,
    contact_first_name: first,
    contact_last_name: last,
    contact_position: clean(form.get("contact_position"), 120),
    contact_phone: clean(form.get("contact_phone"), 40),
    contact_email: clean(form.get("contact_email"), 120),
    office_address: clean(form.get("office_address"), 200),
    town: clean(form.get("town"), 80),
    province,
    country: countryFromRegion(province),
    website: clean(form.get("website"), 300),
    source_url: source,
    research_notes: clean(form.get("research_notes"), 1000),
    proposed_code: proposed,
    reviewed_by: null,
  };
  let { error } = await db().from("prospect_queue").insert(inserted);
  if (error && /country/i.test(error.message)) {
    const { country: _country, ...rest } = inserted;
    void _country;
    ({ error } = await db().from("prospect_queue").insert(rest));
  }
  void account;
  revalidatePath("/admin/dashboard");
}

export type ReviewProspectResult =
  | {
      ok: true;
      updated: number;
      decision: "approved" | "rejected" | "on_hold";
      blocked: { id: string; brokerage: string; missing: ("name" | "phone" | "email")[]; reason: "incomplete" | "closed" }[];
    }
  | { ok: false; error: "auth" | "not_found" | "invalid" | "hold" };

/** Approve, reject or hold one or many queued leads. Incomplete contacts are skipped, not failed. */
export async function reviewProspectAction(form: FormData): Promise<ReviewProspectResult> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false, error: "auth" };
  const ids = [...new Set(form.getAll("id").map((value) => (typeof value === "string" ? value.trim() : "")).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  const decision = clean(form.get("decision"), 10);
  if (!ids.length || (decision !== "approved" && decision !== "rejected" && decision !== "on_hold")) {
    return { ok: false, error: "invalid" };
  }

  const { data } = await db()
    .from("prospect_queue")
    .select("id, brokerage, status, proposed_code, contact_first_name, contact_last_name, contact_name, contact_phone, contact_email, contact_position, town, province, research_notes, created_at")
    .in("id", ids);
  const rows = ((data ?? []) as Omit<ApprovalLead, "country">[]).map((row) => ({ ...row, country: "CA" as const }));
  if (!rows.length) return { ok: false, error: "not_found" };

  const { allow, blocked } = partitionReview(rows, decision);
  const now = new Date().toISOString();
  if (allow.length) {
    const { error } = await db()
      .from("prospect_queue")
      .update({ status: decision, reviewed_by: account.name, reviewed_at: now })
      .in("id", allow.map((row) => row.id))
      .in("status", ["pending", "on_hold"]);
    if (error) {
      if (decision === "on_hold" && /check|status/i.test(error.message)) return { ok: false, error: "hold" };
      return { ok: false, error: "invalid" };
    }
    if (decision === "approved") {
      const s = { assigned: [], errors: [], refreshed: 0, listingChanges: 0, websitesScanned: 0, sourcing: { markets: [], added: 0, duplicates: 0, franchisesSkipped: 0, errors: [], keyEnv: null, customSearch: false }, brokerSitesDown: [], pendingReview: 0 } as DailyJobSummary;
      await assignApproved(s).catch(() => undefined);
      if (s.assigned.length) {
        await postTalisbotCard({
          type: "assigned",
          i18n: assignedCopy(s.assigned),
          metadata: { assigned: s.assigned, reviewedBy: account.name },
          createdBy: "talisbot",
        }).catch(() => undefined);
      }
    }
    await db()
      .from("admin_talisbot_messages")
      .update({ read_at: now })
      .in("prospect_queue_id", allow.map((row) => row.id))
      .eq("type", "needs_review")
      .is("read_at", null);
  }
  for (const messageId of form.getAll("message_id")) {
    if (allow.length && typeof messageId === "string" && /^[0-9a-f-]{36}$/i.test(messageId)) {
      await markAdminTalisbotMessageRead(messageId).catch(() => undefined);
    }
  }
  revalidatePath("/admin/dashboard");
  return { ok: true, updated: allow.length, decision, blocked };
}

export type UpdateProspectContactResult =
  | { ok: true; proposedCode: string | null }
  | { ok: false; error: string };

/** Inline edit: set decision maker first/last, position, phone, email; auto-generate initials code. */
export async function updateProspectContactAction(form: FormData): Promise<UpdateProspectContactResult> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false, error: "auth" };
  const id = clean(form.get("id"), 40);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "invalid" };

  const first = clean(form.get("contact_first_name"), 80);
  const last = clean(form.get("contact_last_name"), 80);
  const position = clean(form.get("contact_position"), 120);
  const phone = clean(form.get("contact_phone"), 40);
  const email = clean(form.get("contact_email"), 120);

  const { data: existing } = await db()
    .from("prospect_queue")
    .select("id, brokerage, proposed_code, assigned_agent_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "not_found" };
  const ex = existing as {
    id: string;
    brokerage: string;
    proposed_code: string | null;
    assigned_agent_id: string | null;
    status: string;
  };

  const parts = personNamePartsFromFirstLast(first, last);
  const contactName = parts ? displayContactName(parts) : null;
  const taken = await loadTakenCodes();
  if (ex.proposed_code) taken.delete(ex.proposed_code.toLowerCase());
  const proposed = parts ? proposeFastCodeFromParts(first, last, taken) : null;

  const { error } = await db()
    .from("prospect_queue")
    .update({
      contact_first_name: first,
      contact_last_name: last,
      contact_name: contactName,
      contact_position: position,
      contact_phone: phone,
      contact_email: email,
      proposed_code: proposed,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  const old = ex.proposed_code?.toLowerCase() ?? null;
  const next = proposed?.toLowerCase() ?? null;
  if (old !== next) {
    if (next) {
      await recordFastCodeUpdate({
        fastCode: next,
        agentId: ex.assigned_agent_id,
        eventType: "note",
        note: `Decision maker saved → ${next.toUpperCase()}${old ? ` (was ${old.toUpperCase()})` : ""}`,
        details: { queueId: id, from: old, to: next, reason: "person_initials" },
        createdBy: `admin:${account.name}`,
      });
    } else if (old) {
      await recordFastCodeUpdate({
        fastCode: old,
        agentId: ex.assigned_agent_id,
        eventType: "note",
        note: "Code pending: decision maker name needed",
        details: { queueId: id, from: old, to: null, reason: "person_initials" },
        createdBy: `admin:${account.name}`,
      });
    }
  }

  await postTalisbotCard({
    type: "result",
    i18n: contactResultCopy(
      [contactName].filter(Boolean) as string[],
      proposed ? [proposed] : [],
    ),
    fastCode: proposed,
    brokerage: ex.brokerage,
    prospectQueueId: id,
    createdBy: "talisbot",
  }).catch(() => undefined);

  revalidatePath("/admin/dashboard");
  return { ok: true, proposedCode: proposed };
}

export type ImportProspectCsvResult =
  | { ok: true; report: ProspectImportReport }
  | { ok: false; error: string };

/** Admin-only CSV upload: match by fast_code or pq:<id>; never changes issued Mapsite codes. */
export async function importProspectContactsCsvAction(form: FormData): Promise<ImportProspectCsvResult> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false, error: "auth" };
  const csvField = form.get("csv");
  const file = form.get("file");
  const text = typeof csvField === "string" ? csvField : file instanceof File ? await file.text() : "";
  if (!text.trim()) return { ok: false, error: "missing_file" };
  if (text.length > 2_000_000) return { ok: false, error: "too_large" };
  const confirm = form.get("confirm") === "yes";
  try {
    const report = await importProspectContactsCsv(text, `admin:${account.name}`, { dryRun: !confirm });
    const names = report.queueUpdated.map((q) => q.brokerage);
    const codes = report.queueUpdated.map((q) => q.newCode).filter(Boolean) as string[];
    if (confirm && (report.queueUpdated.length || report.leadsFilled.length)) {
      await postTalisbotCard({
        type: "result",
        i18n: contactResultCopy(names, codes),
        metadata: { import: true, queueUpdated: report.queueUpdated.length, leadsFilled: report.leadsFilled.length },
        createdBy: "talisbot",
      }).catch(() => undefined);
    }
    revalidatePath("/admin/dashboard");
    return { ok: true, report };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
