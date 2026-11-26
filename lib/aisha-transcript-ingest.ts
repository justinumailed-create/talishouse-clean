/**
 * Persist qualifying Aisha meetings: assign the transcript to Rishav and
 * create (or reuse) a Contact CRM prospect. Called from the post-call
 * webhook and from the Global Admin Aisha meetings page after a read-only
 * fetch. Never calls ElevenLabs itself.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAishaCrmContactDraft,
  findExistingCrmContact,
  normalizeEmailKey,
  normalizePhoneKey,
  type AishaCrmContactDraft,
} from "@/lib/aisha-crm-contact";
import { appendCrmNotes } from "@/lib/crm-leads/field-permissions";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  AISHA_CALL_SOURCE,
  evaluateAishaTranscriptRouting,
  meetingToRoutingInput,
  type RoutingTranscriptTurn,
} from "@/lib/aisha-transcript-routing";

export const RISHAV_ASSOCIATE_LOGIN_ID = "rishav";

export type IngestableAishaMeeting = {
  id: string;
  bot?: string | null;
  status?: string | null;
  startUnix?: number | null;
  durationSecs?: number | null;
  title?: string | null;
  summary?: string | null;
  callerName?: string | null;
  validContact?: { kind: "phone" | "email"; value: string } | null;
  contactRaw?: string | null;
  fields?: Record<string, unknown> | null;
  transcript?: readonly RoutingTranscriptTurn[];
};

export type AishaIngestResult = {
  conversationId: string;
  routed: boolean;
  reason: string;
  transcriptId: string | null;
  leadId: string | null;
  leadAction: "created" | "reused" | "skipped" | null;
};

const TRANSCRIPTS = "aisha_routed_transcripts";
const LEADS = "brokerage_leads";
const HISTORY = "brokerage_lead_edits";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export async function getRishavAssociateId(): Promise<{ id: string; name: string } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const { data } = await db()
    .from("agent_admins")
    .select("id, name, status, login_id")
    .eq("login_id", RISHAV_ASSOCIATE_LOGIN_ID)
    .maybeSingle();
  const row = data as { id: string; name: string; status: string } | null;
  if (!row || row.status !== "active") return null;
  return { id: row.id, name: row.name };
}

async function lookupRegisteredCaller(email: string | null, phone: string | null): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const emailKey = normalizeEmailKey(email);
  const phoneKey = normalizePhoneKey(phone);
  if (emailKey) {
    const { data } = await db().from("registrations").select("id").ilike("email", emailKey).limit(1);
    if (data && data.length > 0) return true;
    const { data: fast } = await db()
      .from("fast_code_registrations")
      .select("id")
      .ilike("email", emailKey)
      .limit(1);
    if (fast && fast.length > 0) return true;
  }
  if (phoneKey) {
    const { data: fastPhone } = await db()
      .from("fast_code_registrations")
      .select("id, cell_phone")
      .limit(200);
    const hit = ((fastPhone ?? []) as Array<{ cell_phone: string | null }>).some(
      (row) => normalizePhoneKey(row.cell_phone) === phoneKey,
    );
    if (hit) return true;
  }
  return false;
}

async function loadDedupLeads(draft: AishaCrmContactDraft) {
  const or: string[] = [];
  if (draft.sourceConversationId) or.push(`source_conversation_id.eq.${draft.sourceConversationId}`);
  const email = normalizeEmailKey(draft.email);
  if (email) or.push(`email_normalized.eq.${email}`);
  const phone = normalizePhoneKey(draft.cellPhone);
  if (phone) or.push(`cell_phone_digits.eq.${phone}`);
  if (or.length === 0) return [];
  const { data } = await db().from(LEADS).select("id, source_conversation_id, email, cell_phone, notes").or(or.join(",")).limit(20);
  return ((data ?? []) as Array<{
    id: string;
    source_conversation_id: string | null;
    email: string | null;
    cell_phone: string | null;
    notes: string | null;
  }>).map((row) => ({
    id: row.id,
    sourceConversationId: row.source_conversation_id,
    email: row.email,
    cellPhone: row.cell_phone,
    notes: row.notes,
  }));
}

async function insertOrReuseLead(
  draft: AishaCrmContactDraft,
  assignee: { id: string; name: string },
): Promise<{ leadId: string; action: "created" | "reused" }> {
  const existing = findExistingCrmContact(draft, await loadDedupLeads(draft));
  if (existing) {
    if (existing.reason !== "conversation") {
      const notes = appendCrmNotes(existing.match.notes, draft.notes);
      await db()
        .from(LEADS)
        .update({
          notes,
          source: AISHA_CALL_SOURCE,
          source_conversation_id: existing.match.sourceConversationId || draft.sourceConversationId,
          updated_by_agent_id: assignee.id,
          updated_by_name: assignee.name,
        })
        .eq("id", existing.match.id);
    }
    return { leadId: existing.match.id, action: "reused" };
  }

  const { data, error } = await db()
    .from(LEADS)
    .insert({
      decision_maker_name: draft.decisionMakerName,
      position: draft.position,
      cell_phone: draft.cellPhone,
      email: draft.email,
      brokerage_name: draft.brokerageName,
      brokerage_website: draft.brokerageWebsite,
      brokerage_address: draft.brokerageAddress,
      office_phone: draft.officePhone,
      latitude: draft.latitude,
      longitude: draft.longitude,
      country: draft.country,
      market: draft.market,
      status: draft.status,
      notes: draft.notes,
      source: draft.source,
      source_conversation_id: draft.sourceConversationId,
      fast_code: draft.fastCode,
      created_by_agent_id: assignee.id,
      created_by_name: assignee.name,
      updated_by_agent_id: assignee.id,
      updated_by_name: assignee.name,
    })
    .select("id")
    .single();

  if (error) {
    // Unique conversation-id race (webhook retry): reuse the existing row.
    if (error.code === "23505") {
      const { data: raced } = await db()
        .from(LEADS)
        .select("id")
        .eq("source_conversation_id", draft.sourceConversationId)
        .maybeSingle();
      if (raced && (raced as { id: string }).id) {
        return { leadId: (raced as { id: string }).id, action: "reused" };
      }
    }
    throw new Error(error.message || "Could not create CRM contact");
  }

  const leadId = (data as { id: string }).id;
  await db().from(HISTORY).insert({
    lead_id: leadId,
    action: "create",
    actor_agent_id: assignee.id,
    actor_name: assignee.name,
    actor_role: "agent",
    changes: {
      source: draft.source,
      source_conversation_id: draft.sourceConversationId,
      decision_maker_name: draft.decisionMakerName,
    },
  });
  return { leadId, action: "created" };
}

export async function ingestQualifyingAishaMeeting(meeting: IngestableAishaMeeting): Promise<AishaIngestResult> {
  const conversationId = meeting.id;
  const decision = evaluateAishaTranscriptRouting(meetingToRoutingInput(meeting));
  if (!decision.route) {
    return {
      conversationId,
      routed: false,
      reason: decision.reasons.join("; ") || decision.exclusion || "excluded",
      transcriptId: null,
      leadId: null,
      leadAction: "skipped",
    };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      conversationId,
      routed: false,
      reason: "database unavailable",
      transcriptId: null,
      leadId: null,
      leadAction: "skipped",
    };
  }

  const assignee = await getRishavAssociateId();
  if (!assignee) {
    return {
      conversationId,
      routed: false,
      reason: "Rishav associate account is missing or disabled",
      transcriptId: null,
      leadId: null,
      leadAction: "skipped",
    };
  }

  const { data: already } = await db()
    .from(TRANSCRIPTS)
    .select("id, brokerage_lead_id")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (already) {
    const row = already as { id: string; brokerage_lead_id: string | null };
    return {
      conversationId,
      routed: true,
      reason: "already ingested",
      transcriptId: row.id,
      leadId: row.brokerage_lead_id,
      leadAction: "reused",
    };
  }

  const draft = buildAishaCrmContactDraft(meeting);
  const isRegistered = await lookupRegisteredCaller(draft.email, draft.cellPhone);
  const { leadId, action } = await insertOrReuseLead(draft, assignee);
  const startedAt = meeting.startUnix ? new Date(meeting.startUnix * 1000).toISOString() : null;

  const { data: stored, error } = await db()
    .from(TRANSCRIPTS)
    .insert({
      conversation_id: conversationId,
      started_at: startedAt,
      duration_secs: meeting.durationSecs ?? null,
      status: meeting.status ?? null,
      caller_name: draft.decisionMakerName,
      caller_phone: draft.cellPhone,
      caller_email: draft.email,
      market: draft.market,
      fast_code: draft.fastCode,
      is_registered: isRegistered,
      title: meeting.title ?? null,
      summary: meeting.summary ?? null,
      fields: meeting.fields ?? {},
      transcript: meeting.transcript ?? [],
      assigned_agent_id: assignee.id,
      brokerage_lead_id: leadId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await db()
        .from(TRANSCRIPTS)
        .select("id, brokerage_lead_id")
        .eq("conversation_id", conversationId)
        .maybeSingle();
      const row = raced as { id: string; brokerage_lead_id: string | null } | null;
      return {
        conversationId,
        routed: true,
        reason: "already ingested",
        transcriptId: row?.id ?? null,
        leadId: row?.brokerage_lead_id ?? leadId,
        leadAction: "reused",
      };
    }
    throw new Error(error.message || "Could not store routed transcript");
  }

  return {
    conversationId,
    routed: true,
    reason: isRegistered ? "routed (registered caller)" : "routed (unregistered caller)",
    transcriptId: (stored as { id: string }).id,
    leadId,
    leadAction: action,
  };
}

export async function ingestQualifyingAishaMeetings(
  meetings: readonly IngestableAishaMeeting[],
): Promise<AishaIngestResult[]> {
  const results: AishaIngestResult[] = [];
  for (const meeting of meetings) {
    try {
      results.push(await ingestQualifyingAishaMeeting(meeting));
    } catch (error) {
      results.push({
        conversationId: meeting.id,
        routed: false,
        reason: error instanceof Error ? error.message : "ingest failed",
        transcriptId: null,
        leadId: null,
        leadAction: "skipped",
      });
    }
  }
  return results;
}

export type RoutedAishaTranscript = {
  id: string;
  conversationId: string;
  startedAt: string | null;
  durationSecs: number | null;
  status: string | null;
  callerName: string | null;
  callerPhone: string | null;
  callerEmail: string | null;
  market: string | null;
  fastCode: string | null;
  isRegistered: boolean | null;
  title: string | null;
  summary: string | null;
  fields: Record<string, unknown>;
  transcript: RoutingTranscriptTurn[];
  assignedAgentId: string | null;
  leadId: string | null;
  createdAt: string;
};

export async function listRoutedAishaTranscripts(options: {
  assigneeId?: string | null;
  all?: boolean;
  limit?: number;
}): Promise<RoutedAishaTranscript[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let query = db()
    .from(TRANSCRIPTS)
    .select(
      "id, conversation_id, started_at, duration_secs, status, caller_name, caller_phone, caller_email, market, fast_code, is_registered, title, summary, fields, transcript, assigned_agent_id, brokerage_lead_id, created_at",
    )
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(options.limit ?? 100);
  if (!options.all && options.assigneeId) query = query.eq("assigned_agent_id", options.assigneeId);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    conversationId: String(row.conversation_id),
    startedAt: (row.started_at as string | null) ?? null,
    durationSecs: (row.duration_secs as number | null) ?? null,
    status: (row.status as string | null) ?? null,
    callerName: (row.caller_name as string | null) ?? null,
    callerPhone: (row.caller_phone as string | null) ?? null,
    callerEmail: (row.caller_email as string | null) ?? null,
    market: (row.market as string | null) ?? null,
    fastCode: (row.fast_code as string | null) ?? null,
    isRegistered: (row.is_registered as boolean | null) ?? null,
    title: (row.title as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    fields: (row.fields as Record<string, unknown>) ?? {},
    transcript: Array.isArray(row.transcript) ? (row.transcript as RoutingTranscriptTurn[]) : [],
    assignedAgentId: (row.assigned_agent_id as string | null) ?? null,
    leadId: (row.brokerage_lead_id as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}
