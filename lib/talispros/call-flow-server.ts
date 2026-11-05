import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { LEAD_POSITIONS, type LeadPosition, type LeadStatus, type NormalizedLead, validateLeadValues } from "@/lib/crm-leads/model";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { getAgentContractCode } from "@/lib/talispros/mapsite-contract-service";
import { mapsiteHrefForSlot, mapsiteTownFromAddress } from "@/lib/talispros/fast-code-slots";
import { loadOwnTebViewerHref } from "@/lib/talisbooks/own-teb-href";
import {
  activityStreak,
  canCommentOnFlow,
  canEditFlowLead,
  CHECKPOINT_KEYS,
  checkpointOpenedBy,
  compareNextAction,
  countryFromProvince,
  earnedBadges,
  externalBrokerageWebsite,
  firstNameOf,
  isCallStepKey,
  isCheckpointKey,
  isLeaderboardLogin,
  isStepOutcome,
  isStepUnlocked,
  leadStatusForStage,
  nextActionOf,
  nextStepKey,
  pointsForSteps,
  progressPercent,
  rankLeaderboard,
  resolveBrokerageWebsite,
  stageForOutcome,
  type BadgeKey,
  type CallStepKey,
  type CheckpointKey,
  type SavedStep,
} from "@/lib/talispros/call-flow";
import { buildStepViews, positionSpoken, stepLabel, type FlowLocale, type StepView } from "@/lib/talispros/call-flow-copy";
import {
  FAST_CODE_EVENT_LABELS,
  isFastCodeStage,
  stageLabel,
  type FastCodeStage,
  type FastCodeUpdate,
} from "@/lib/talispros/fast-code-tracker";
import {
  getTrackedCode,
  listFastCodeUpdates,
  listTrackerRows,
  recordFastCodeUpdate,
  setFastCodeStage,
  type TrackerRow,
} from "@/lib/talispros/fast-code-tracker-server";

export type FlowActor = {
  access: "agent" | "reviewer" | "admin";
  agentId: string | null;
  name: string;
};

export type BoardCard = {
  fastCode: string;
  brokerage: string;
  contact: string | null;
  town: string | null;
  phone: string | null;
  email: string | null;
  stage: FastCodeStage;
  mapsiteHref: string;
  tebHref: string;
  next: CallStepKey | "done" | "stopped";
  progress: number;
  points: number;
  checkpoint: CheckpointKey | null;
  commentCount: number;
  agentId: string | null;
  agentName: string | null;
};

export type LeaderRow = {
  loginId: string;
  name: string;
  points: number;
  streak: number;
  badges: BadgeKey[];
};

export type FlowComment = {
  id: string;
  checkpoint: CheckpointKey;
  authorName: string;
  authorRole: "admin" | "reviewer";
  body: string;
  createdAt: string;
};

export type LeadFormState = {
  id: string | null;
  decisionMakerName: string;
  position: LeadPosition;
  cellPhone: string;
  email: string;
  brokerageName: string;
  brokerageWebsite: string;
  brokerageAddress: string;
  officePhone: string;
  country: "Canada" | "USA";
  market: string;
  town: string;
  agentCount: string;
  source: string;
  notes: string;
};

export type LeadBundle = {
  fastCode: string;
  mapsiteHref: string;
  tebHref: string;
  registerUrl: string;
  stage: FastCodeStage;
  entryCode: string | null;
  canEdit: boolean;
  canComment: boolean;
  lead: LeadFormState;
  steps: StepView[];
  comments: FlowComment[];
  checkpoints: CheckpointKey[];
  history: { id: string; at: string; label: string; note: string | null }[];
};

const LEADER_LOGINS = ["aritri", "enanko"] as const;

type StepRow = {
  fast_code: string;
  step_key: string;
  response: string;
  outcome: string;
  created_at: string;
  agent_id: string | null;
};

type LeadLink = {
  id: string;
  fast_code: string | null;
  decision_maker_name: string;
  position: string;
  cell_phone: string | null;
  email: string | null;
  brokerage_name: string;
  brokerage_website: string | null;
  brokerage_address: string | null;
  office_phone: string | null;
  country: string;
  market: string | null;
  town: string | null;
  agent_count: number | null;
  source: string | null;
  notes: string | null;
};

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function codeOf(value: string): string {
  return value.trim().toLowerCase();
}

function toSaved(rows: readonly StepRow[]): SavedStep[] {
  const saved: SavedStep[] = [];
  for (const row of rows) {
    if (!isCallStepKey(row.step_key) || !isStepOutcome(row.outcome)) continue;
    saved.push({ step: row.step_key, outcome: row.outcome, response: row.response, at: row.created_at });
  }
  return saved;
}

function furthestCheckpoint(keys: readonly CheckpointKey[]): CheckpointKey | null {
  let best: CheckpointKey | null = null;
  for (const key of CHECKPOINT_KEYS) if (keys.includes(key)) best = key;
  return best;
}

function isPosition(value: string): value is LeadPosition {
  return (LEAD_POSITIONS as readonly string[]).includes(value);
}

async function stepRows(codes: string[]): Promise<StepRow[]> {
  if (!codes.length || !isSupabaseAdminConfigured()) return [];
  const { data, error } = await db()
    .from("fast_code_step_responses")
    .select("fast_code, step_key, response, outcome, created_at, agent_id")
    .in("fast_code", codes);
  if (error) return [];
  return (data ?? []) as StepRow[];
}

async function checkpointMap(codes: string[]): Promise<Map<string, CheckpointKey[]>> {
  const map = new Map<string, CheckpointKey[]>();
  if (!codes.length || !isSupabaseAdminConfigured()) return map;
  const { data, error } = await db().from("fast_code_checkpoints").select("fast_code, checkpoint_key").in("fast_code", codes);
  if (error) return map;
  for (const row of (data ?? []) as { fast_code: string; checkpoint_key: string }[]) {
    if (!isCheckpointKey(row.checkpoint_key)) continue;
    const list = map.get(row.fast_code) ?? [];
    list.push(row.checkpoint_key);
    map.set(row.fast_code, list);
  }
  return map;
}

async function commentCounts(codes: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!codes.length || !isSupabaseAdminConfigured()) return map;
  const { data, error } = await db().from("fast_code_checkpoint_comments").select("fast_code").in("fast_code", codes);
  if (error) return map;
  for (const row of (data ?? []) as { fast_code: string }[]) map.set(row.fast_code, (map.get(row.fast_code) ?? 0) + 1);
  return map;
}

async function leadLinks(codes: string[]): Promise<Map<string, LeadLink>> {
  const map = new Map<string, LeadLink>();
  if (!codes.length || !isSupabaseAdminConfigured()) return map;
  const { data, error } = await db()
    .from("brokerage_leads")
    .select(
      "id, fast_code, decision_maker_name, position, cell_phone, email, brokerage_name, brokerage_website, brokerage_address, office_phone, country, market, town, agent_count, source, notes",
    )
    .in("fast_code", codes);
  if (error) return map;
  for (const row of (data ?? []) as LeadLink[]) {
    if (row.fast_code) map.set(row.fast_code, row);
  }
  return map;
}

async function assemble(rows: TrackerRow[]): Promise<BoardCard[]> {
  const codes = rows.map((row) => row.fastCode.toLowerCase());
  const [steps, checkpoints, comments, leads] = await Promise.all([
    stepRows(codes),
    checkpointMap(codes),
    commentCounts(codes),
    leadLinks(codes),
  ]);
  const byCode = new Map<string, StepRow[]>();
  for (const row of steps) {
    const list = byCode.get(row.fast_code) ?? [];
    list.push(row);
    byCode.set(row.fast_code, list);
  }
  const cards = rows.map((row) => {
    const code = row.fastCode.toLowerCase();
    const saved = toSaved(byCode.get(code) ?? []);
    const lead = leads.get(code);
    const touched = saved.map((item) => item.at).sort().at(-1) ?? "";
    return {
      card: {
        fastCode: row.fastCode,
        brokerage: lead?.brokerage_name || row.brokerage,
        contact: lead?.decision_maker_name || row.contact,
        town: lead?.town || null,
        phone: lead?.cell_phone || lead?.office_phone || null,
        email: lead?.email || null,
        stage: row.stage,
        mapsiteHref: row.mapsiteHref,
        tebHref: row.tebHref,
        next: nextStepKey(saved),
        progress: progressPercent(saved),
        points: pointsForSteps(saved),
        checkpoint: furthestCheckpoint(checkpoints.get(code) ?? []),
        commentCount: comments.get(code) ?? 0,
        agentId: row.agentId,
        agentName: row.agentName,
      } satisfies BoardCard,
      action: nextActionOf(saved, touched),
    };
  });
  cards.sort((a, b) => compareNextAction(a.action, b.action) || a.card.fastCode.localeCompare(b.card.fastCode));
  return cards.map((item) => item.card);
}

export async function loadAgentBoard(agentId: string): Promise<BoardCard[]> {
  return assemble(await listTrackerRows({ agentId }).catch(() => []));
}

export async function loadReviewBoard(): Promise<BoardCard[]> {
  return assemble(await listTrackerRows().catch(() => []));
}

export async function loadCheckpointRollup(): Promise<Map<string, { checkpoint: CheckpointKey | null; comments: number }>> {
  const map = new Map<string, { checkpoint: CheckpointKey | null; comments: number }>();
  if (!isSupabaseAdminConfigured()) return map;
  const [{ data: checks, error: checkError }, { data: comments, error: commentError }] = await Promise.all([
    db().from("fast_code_checkpoints").select("fast_code, checkpoint_key"),
    db().from("fast_code_checkpoint_comments").select("fast_code"),
  ]);
  if (checkError || commentError) return map;
  const keys = new Map<string, CheckpointKey[]>();
  for (const row of (checks ?? []) as { fast_code: string; checkpoint_key: string }[]) {
    if (!isCheckpointKey(row.checkpoint_key)) continue;
    const list = keys.get(row.fast_code) ?? [];
    list.push(row.checkpoint_key);
    keys.set(row.fast_code, list);
  }
  const counts = new Map<string, number>();
  for (const row of (comments ?? []) as { fast_code: string }[]) counts.set(row.fast_code, (counts.get(row.fast_code) ?? 0) + 1);
  for (const code of new Set([...keys.keys(), ...counts.keys()])) {
    map.set(code, { checkpoint: furthestCheckpoint(keys.get(code) ?? []), comments: counts.get(code) ?? 0 });
  }
  return map;
}

export async function loadLeaderboard(now = new Date()): Promise<LeaderRow[]> {
  if (!isSupabaseAdminConfigured()) {
    return rankLeaderboard(LEADER_LOGINS.map((loginId) => ({ loginId, name: loginId, points: 0, streak: 0, badges: [] })));
  }
  const { data: agents } = await db().from("agent_admins").select("id, login_id, name").in("login_id", [...LEADER_LOGINS]);
  const people = ((agents ?? []) as { id: string; login_id: string; name: string }[]).filter((row) => isLeaderboardLogin(row.login_id));
  const ids = people.map((row) => row.id);
  const { data: steps } = ids.length
    ? await db().from("fast_code_step_responses").select("agent_id, step_key, outcome, created_at").in("agent_id", ids)
    : { data: [] as StepRow[] };
  const grouped = new Map<string, SavedStep[]>();
  const times = new Map<string, string[]>();
  for (const row of (steps ?? []) as StepRow[]) {
    if (!row.agent_id || !isCallStepKey(row.step_key) || !isStepOutcome(row.outcome)) continue;
    const list = grouped.get(row.agent_id) ?? [];
    list.push({ step: row.step_key, outcome: row.outcome, response: "", at: row.created_at });
    grouped.set(row.agent_id, list);
    const stamps = times.get(row.agent_id) ?? [];
    stamps.push(row.created_at);
    times.set(row.agent_id, stamps);
  }
  return rankLeaderboard(
    LEADER_LOGINS.map((loginId) => {
      const person = people.find((row) => row.login_id === loginId);
      const saved = person ? (grouped.get(person.id) ?? []) : [];
      return {
        loginId,
        name: person?.name || loginId,
        points: pointsForSteps(saved),
        streak: activityStreak(person ? (times.get(person.id) ?? []) : [], now),
        badges: earnedBadges(saved),
      };
    }),
  );
}

export async function loadAgentStats(agentId: string, now = new Date()): Promise<{ points: number; streak: number; badges: BadgeKey[] }> {
  if (!isSupabaseAdminConfigured()) return { points: 0, streak: 0, badges: [] };
  const { data, error } = await db()
    .from("fast_code_step_responses")
    .select("fast_code, step_key, response, outcome, created_at, agent_id")
    .eq("agent_id", agentId);
  if (error) return { points: 0, streak: 0, badges: [] };
  const rows = (data ?? []) as StepRow[];
  const saved = toSaved(rows);
  return {
    points: pointsForSteps(saved),
    streak: activityStreak(rows.map((row) => row.created_at), now),
    badges: earnedBadges(saved),
  };
}

function blankLead(seed: Partial<LeadFormState> & { brokerageName: string }): LeadFormState {
  return {
    id: seed.id ?? null,
    decisionMakerName: seed.decisionMakerName || seed.brokerageName,
    position: seed.position && isPosition(seed.position) ? seed.position : "broker",
    cellPhone: seed.cellPhone || "",
    email: seed.email || "",
    brokerageName: seed.brokerageName,
    brokerageWebsite: seed.brokerageWebsite || "",
    brokerageAddress: seed.brokerageAddress || "",
    officePhone: seed.officePhone || "",
    country: seed.country === "USA" ? "USA" : "Canada",
    market: seed.market || "",
    town: seed.town || "",
    agentCount: seed.agentCount || "",
    source: seed.source || "Mapsite",
    notes: seed.notes || "",
  };
}

function fromLink(row: LeadLink): LeadFormState {
  return blankLead({
    id: row.id,
    decisionMakerName: row.decision_maker_name,
    position: isPosition(row.position) ? row.position : "broker",
    cellPhone: row.cell_phone || "",
    email: row.email || "",
    brokerageName: row.brokerage_name,
    brokerageWebsite: row.brokerage_website || "",
    brokerageAddress: row.brokerage_address || "",
    officePhone: row.office_phone || "",
    country: row.country === "USA" ? "USA" : "Canada",
    market: row.market || "",
    town: row.town || "",
    agentCount: row.agent_count === null || row.agent_count === undefined ? "" : String(row.agent_count),
    source: row.source || "",
    notes: row.notes || "",
  });
}

type SiteSources = { queue: string | null; brokerUrl: string | null; mapsiteWebsite: string | null };

async function brokerageSiteSources(code: string, mapsiteId: string | null): Promise<SiteSources> {
  const mapQuery = mapsiteId
    ? db().from("mapsites").select("broker_url, website").eq("id", mapsiteId).maybeSingle()
    : db().from("mapsites").select("broker_url, website").ilike("fast_code", code).maybeSingle();
  const [{ data: mapData }, { data: queued }] = await Promise.all([
    mapQuery,
    db().from("prospect_queue").select("website").ilike("proposed_code", code).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const map = mapData as { broker_url?: string | null; website?: string | null } | null;
  return {
    queue: (queued as { website?: string | null } | null)?.website ?? null,
    brokerUrl: map?.broker_url ?? null,
    mapsiteWebsite: map?.website ?? null,
  };
}

/** Replace an internal path with the brokerage site. A real http(s) site stays. */
async function healLeadWebsite(linked: LeadLink, sources: SiteSources): Promise<LeadFormState> {
  if (externalBrokerageWebsite(linked.brokerage_website)) return fromLink(linked);
  const next = resolveBrokerageWebsite(null, sources.queue, sources.brokerUrl, sources.mapsiteWebsite);
  const current = linked.brokerage_website || null;
  if (current === next || (!current && !next)) return fromLink(linked);
  const { error } = await db().from("brokerage_leads").update({ brokerage_website: next }).eq("id", linked.id);
  if (error) return fromLink(linked);
  await db().from("brokerage_lead_edits").insert({
    lead_id: linked.id,
    action: "update",
    actor_agent_id: null,
    actor_name: "system",
    actor_role: "superadmin",
    changes: { brokerage_website: { from: current, to: next } },
  });
  return fromLink({ ...linked, brokerage_website: next });
}

async function ensureLead(
  code: string,
  tracked: { agentId: string | null; mapsiteId: string | null; stage: FastCodeStage },
  actorName: string,
): Promise<LeadFormState> {
  const linked = (await leadLinks([code])).get(code);
  const sources = await brokerageSiteSources(code, tracked.mapsiteId);
  if (linked) return healLeadWebsite(linked, sources);

  const { data: mapData } = tracked.mapsiteId
    ? await db()
        .from("mapsites")
        .select("id, property_title, agent_name, property_address, email, phone, website, broker_url, owner_first_name, owner_last_name, latitude, longitude")
        .eq("id", tracked.mapsiteId)
        .maybeSingle()
    : { data: null };
  const mapsite = mapData as {
    property_title: string | null;
    agent_name: string | null;
    property_address: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    broker_url: string | null;
    owner_first_name: string | null;
    owner_last_name: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  const { data: queued } = await db()
    .from("prospect_queue")
    .select("brokerage, contact_name, office_address, town, province, website, office_phone, source_url, market")
    .ilike("proposed_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const queue = queued as {
    brokerage: string;
    contact_name: string | null;
    office_address: string | null;
    town: string | null;
    province: string | null;
    website: string | null;
    office_phone: string | null;
    source_url: string | null;
    market: string | null;
  } | null;

  const brokerage = queue?.brokerage?.trim() || mapsite?.property_title?.trim() || code.toUpperCase();
  const owner = [mapsite?.owner_first_name, mapsite?.owner_last_name].filter(Boolean).join(" ").trim();
  const decision = queue?.contact_name?.trim() || mapsite?.agent_name?.trim() || owner || brokerage;
  const address = queue?.office_address?.trim() || mapsite?.property_address?.trim() || "";
  const parsedTown = mapsiteTownFromAddress(address, "");
  const town = queue?.town?.trim() || (parsedTown && parsedTown !== "Mapsite" ? parsedTown : "");
  const source = queue?.source_url?.includes("google") ? "Google" : queue?.source_url ? "Research" : "Mapsite";
  const named = tracked.agentId
    ? ((await db().from("agent_admins").select("name").eq("id", tracked.agentId).maybeSingle()).data as { name?: string } | null)?.name
    : null;
  const seed = blankLead({
    decisionMakerName: decision,
    brokerageName: brokerage,
    brokerageWebsite: resolveBrokerageWebsite(null, queue?.website, mapsite?.broker_url, mapsite?.website) || "",
    brokerageAddress: address,
    officePhone: queue?.office_phone || mapsite?.phone || "",
    email: mapsite?.email || "",
    country: countryFromProvince(queue?.province),
    market: queue?.market || "",
    town,
    source,
  });
  const createdByName = named || actorName;
  const { data, error } = await db()
    .from("brokerage_leads")
    .insert({
      decision_maker_name: seed.decisionMakerName,
      position: seed.position,
      cell_phone: seed.cellPhone || null,
      email: seed.email || null,
      brokerage_name: seed.brokerageName,
      brokerage_website: seed.brokerageWebsite || null,
      brokerage_address: seed.brokerageAddress || null,
      office_phone: seed.officePhone || null,
      country: seed.country,
      market: seed.market || null,
      status: leadStatusForStage(tracked.stage),
      notes: null,
      latitude: mapsite?.latitude ?? null,
      longitude: mapsite?.longitude ?? null,
      fast_code: code,
      mapsite_id: tracked.mapsiteId,
      town: seed.town || null,
      source: seed.source,
      created_by_agent_id: tracked.agentId,
      created_by_name: createdByName,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    const again = (await leadLinks([code])).get(code);
    return again ? fromLink(again) : seed;
  }
  const id = (data as { id: string }).id;
  await db().from("brokerage_lead_edits").insert({
    lead_id: id,
    action: "create",
    actor_agent_id: tracked.agentId,
    actor_name: createdByName,
    actor_role: "agent",
    changes: { fast_code: code, source: seed.source },
  });
  return { ...seed, id };
}

function historyLabel(update: FastCodeUpdate, locale: FlowLocale): { label: string; note: string | null } {
  const event = FAST_CODE_EVENT_LABELS[locale][update.eventType];
  if (update.eventType === "stage" && update.stage) {
    const from = isFastCodeStage(update.details.from) ? stageLabel(String(update.details.from), locale) : null;
    return { label: `${event}: ${from ? `${from} → ` : ""}${stageLabel(update.stage, locale)}`, note: update.note };
  }
  if (update.eventType === "step" && isCallStepKey(update.details.step)) {
    return { label: `${event}: ${stepLabel(update.details.step, locale)}`, note: update.note };
  }
  return { label: event, note: update.note };
}

async function ownerName(agentId: string | null, fallback: string): Promise<string> {
  if (!agentId) return fallback;
  const { data } = await db().from("agent_admins").select("name").eq("id", agentId).maybeSingle();
  return (data as { name?: string } | null)?.name || fallback;
}

export async function loadLeadFlow(rawCode: string, actor: FlowActor, locale: FlowLocale): Promise<LeadBundle | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const code = codeOf(rawCode);
  if (!/^[a-z0-9-]{2,40}$/.test(code)) return null;
  const tracked = await getTrackedCode(code);
  if (!tracked) return null;
  const allowed = actor.access === "admin" || actor.access === "reviewer" || (actor.access === "agent" && actor.agentId === tracked.agentId);
  if (!allowed) return null;

  const lead = await ensureLead(code, tracked, actor.name);
  const [steps, checks, commentRes, updates, teb, mapRow] = await Promise.all([
    stepRows([code]),
    checkpointMap([code]),
    db()
      .from("fast_code_checkpoint_comments")
      .select("id, checkpoint_key, author_name, author_role, body, created_at")
      .eq("fast_code", code)
      .order("created_at", { ascending: true }),
    listFastCodeUpdates({ fastCode: code, limit: 80 }),
    loadOwnTebViewerHref(code).catch(() => null),
    tracked.mapsiteId
      ? db().from("mapsites").select("account_type").eq("id", tracked.mapsiteId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const saved = toSaved(steps);
  const accountType = (mapRow.data as { account_type?: string | null } | null)?.account_type ?? null;
  const mapsiteHref = mapsiteHrefForSlot(accountType, code);
  const tebHref = teb || `/talisbooks/fast/${code}`;
  const registerUrl = `/talisu/reg?fastCode=${encodeURIComponent(code.toUpperCase())}`;
  const canEdit = canEditFlowLead(actor.access, actor.agentId, tracked.agentId);
  const entryCode = canEdit && tracked.agentId ? await getAgentContractCode(tracked.agentId).catch(() => null) : null;
  const comments: FlowComment[] = [];
  for (const row of (commentRes.data ?? []) as {
    id: string;
    checkpoint_key: string;
    author_name: string;
    author_role: string;
    body: string;
    created_at: string;
  }[]) {
    if (!isCheckpointKey(row.checkpoint_key)) continue;
    if (row.author_role !== "admin" && row.author_role !== "reviewer") continue;
    comments.push({
      id: row.id,
      checkpoint: row.checkpoint_key,
      authorName: row.author_name,
      authorRole: row.author_role,
      body: row.body,
      createdAt: row.created_at,
    });
  }
  return {
    fastCode: code.toUpperCase(),
    mapsiteHref,
    tebHref,
    registerUrl,
    stage: tracked.stage,
    entryCode,
    canEdit,
    canComment: canCommentOnFlow(actor.access),
    lead,
    steps: buildStepViews(
      locale,
      {
        firstName: firstNameOf(lead.decisionMakerName),
        agentName: actor.access === "agent" ? actor.name : await ownerName(tracked.agentId, actor.name),
        brokerage: lead.brokerageName,
        town: lead.town,
        position: positionSpoken(lead.position, locale),
        fastCode: code.toUpperCase(),
        mapsiteUrl: mapsiteHref,
        tebUrl: tebHref,
        registerUrl,
        agentCount: lead.agentCount ? Number(lead.agentCount) : null,
      },
      saved,
    ),
    comments,
    checkpoints: checks.get(code) ?? [],
    history: updates.map((update) => {
      const text = historyLabel(update, locale);
      return { id: update.id, at: update.createdAt, label: text.label, note: text.note };
    }),
  };
}

function leadPatch(lead: NormalizedLead, extra: { town: string; source: string; agentCount: number | null; stage: FastCodeStage }) {
  return {
    decision_maker_name: lead.decisionMakerName,
    position: lead.position,
    cell_phone: lead.cellPhone,
    email: lead.email,
    brokerage_name: lead.brokerageName,
    brokerage_website: lead.brokerageWebsite,
    brokerage_address: lead.brokerageAddress,
    office_phone: lead.officePhone,
    country: lead.country,
    market: lead.market,
    status: leadStatusForStage(extra.stage) satisfies LeadStatus,
    notes: lead.notes,
    town: extra.town || null,
    source: extra.source || null,
    agent_count: extra.agentCount,
  };
}

export async function saveLeadDetails(
  rawCode: string,
  actor: FlowActor,
  input: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const code = codeOf(rawCode);
  const tracked = await getTrackedCode(code);
  if (!tracked || !canEditFlowLead(actor.access, actor.agentId, tracked.agentId)) return { ok: false, error: "forbidden" };
  const validated = validateLeadValues({
    decision_maker_name: input.decisionMakerName,
    position: input.position,
    cell_phone: input.cellPhone,
    email: input.email,
    brokerage_name: input.brokerageName,
    brokerage_website: resolveBrokerageWebsite(input.brokerageWebsite) || "",
    brokerage_address: input.brokerageAddress,
    office_phone: input.officePhone,
    country: input.country,
    market: input.market,
    status: leadStatusForStage(tracked.stage),
    notes: input.notes,
    latitude: "",
    longitude: "",
  });
  if (!validated.lead) return { ok: false, error: "invalid" };
  const town = (input.town || "").trim().slice(0, 120);
  const source = (input.source || "").trim().slice(0, 300);
  const countRaw = (input.agentCount || "").trim();
  let agentCount: number | null = null;
  if (countRaw) {
    if (!/^\d{1,4}$/.test(countRaw)) return { ok: false, error: "invalid" };
    agentCount = Number(countRaw);
    if (agentCount > 5000) return { ok: false, error: "invalid" };
  }
  const lead = await ensureLead(code, tracked, actor.name);
  if (!lead.id) return { ok: false, error: "failed" };
  const patch = leadPatch(validated.lead, { town, source, agentCount, stage: tracked.stage });
  const { error } = await db()
    .from("brokerage_leads")
    .update({ ...patch, fast_code: code, mapsite_id: tracked.mapsiteId, updated_by_agent_id: actor.agentId, updated_by_name: actor.name })
    .eq("id", lead.id);
  if (error) return { ok: false, error: "failed" };
  await db().from("brokerage_lead_edits").insert({
    lead_id: lead.id,
    action: "update",
    actor_agent_id: actor.agentId,
    actor_name: actor.name,
    actor_role: actor.access === "admin" ? "superadmin" : "agent",
    changes: { fields: Object.keys(patch) },
  });
  await recordFastCodeUpdate({
    fastCode: code,
    agentId: tracked.agentId,
    mapsiteId: tracked.mapsiteId,
    eventType: "lead",
    stage: tracked.stage,
    note: "Lead updated",
    details: { fields: Object.keys(patch) },
    createdBy: actor.name,
  });
  return { ok: true };
}

export async function saveStepResponse(
  rawCode: string,
  actor: FlowActor,
  step: string,
  outcome: string,
  response: string,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "locked" | "invalid" | "failed" }> {
  const code = codeOf(rawCode);
  if (!isCallStepKey(step) || !isStepOutcome(outcome)) return { ok: false, error: "invalid" };
  const text = response.trim();
  if (!text || text.length > 4000) return { ok: false, error: "invalid" };
  const tracked = await getTrackedCode(code);
  if (!tracked || !canEditFlowLead(actor.access, actor.agentId, tracked.agentId)) return { ok: false, error: "forbidden" };
  const saved = toSaved(await stepRows([code]));
  if (saved.some((row) => row.step === step)) return { ok: true };
  if (!isStepUnlocked(step, saved)) return { ok: false, error: "locked" };
  const { error } = await db().from("fast_code_step_responses").insert({
    fast_code: code,
    step_key: step,
    response: text,
    outcome,
    agent_id: tracked.agentId ?? actor.agentId,
  });
  if (error) return { ok: false, error: "failed" };
  const stage = stageForOutcome(step, outcome);
  await setFastCodeStage(code, stage, { agentId: tracked.agentId, by: actor.name });
  await db().from("brokerage_leads").update({ status: leadStatusForStage(stage) }).eq("fast_code", code);
  const checkpoint = checkpointOpenedBy(step, outcome);
  if (checkpoint) {
    await db().from("fast_code_checkpoints").upsert(
      { fast_code: code, checkpoint_key: checkpoint },
      { onConflict: "fast_code,checkpoint_key", ignoreDuplicates: true },
    );
  }
  await recordFastCodeUpdate({
    fastCode: code,
    agentId: tracked.agentId,
    mapsiteId: tracked.mapsiteId,
    eventType: "step",
    stage,
    note: text,
    details: { step, outcome, checkpoint },
    createdBy: actor.name,
  });
  return { ok: true };
}

export async function saveCheckpointComment(
  rawCode: string,
  actor: FlowActor,
  checkpoint: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const code = codeOf(rawCode);
  if (!isCheckpointKey(checkpoint)) return { ok: false, error: "invalid" };
  const text = body.trim();
  if (!text || text.length > 2000) return { ok: false, error: "invalid" };
  if (!canCommentOnFlow(actor.access)) return { ok: false, error: "forbidden" };
  const tracked = await getTrackedCode(code);
  if (!tracked) return { ok: false, error: "invalid" };
  const open = (await checkpointMap([code])).get(code) ?? [];
  if (!open.includes(checkpoint)) return { ok: false, error: "invalid" };
  const { error } = await db().from("fast_code_checkpoint_comments").insert({
    fast_code: code,
    checkpoint_key: checkpoint,
    author_agent_id: actor.agentId,
    author_name: actor.name,
    author_role: actor.access === "reviewer" ? "reviewer" : "admin",
    body: text,
  });
  if (error) return { ok: false, error: "failed" };
  await recordFastCodeUpdate({
    fastCode: code,
    agentId: actor.agentId,
    mapsiteId: tracked.mapsiteId,
    eventType: "comment",
    stage: tracked.stage,
    note: text,
    details: { checkpoint },
    createdBy: actor.name,
  });
  return { ok: true };
}
