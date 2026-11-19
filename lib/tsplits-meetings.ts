/**
 * Tsplits™ admin: Meetings by Aisha / Webster, Follow Ups and To-dos.
 *
 * The public site stores nothing from the voice calls. Everything lives in the
 * ElevenLabs conversations of Ralf's Tsplits™ workspace, so the admin reads them
 * server-side (read-only GET endpoints) with ELEVENLABS_API_KEY.
 * Never import this from a client component: it reads the API key.
 */
import { AISHA_HOMEPAGE_AGENT_ID } from "./talispros/aisha-mapsite-agent";
import { WEBSTER_PROJECT_AGENT_ID } from "./talispros/webster-project";

export const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";
export const MEETINGS_REVALIDATE_SECS = 60;
export const MEETINGS_TIME_ZONE = "Asia/Kolkata";

export type MeetingBotKey = "aisha" | "webster";

export type MeetingField = { key: string; label: string };

export const MEETING_BOTS: Record<
  MeetingBotKey,
  { key: MeetingBotKey; name: string; role: string; agentId: string; href: string; fields: readonly MeetingField[] }
> = {
  aisha: {
    key: "aisha",
    name: "Aisha",
    role: "Registrar · Team Leader",
    agentId: AISHA_HOMEPAGE_AGENT_ID,
    href: "/admin/meetings/aisha",
    fields: [
      { key: "account_type_interest", label: "Interest" },
      { key: "business_type", label: "Business" },
      { key: "market_location", label: "Market" },
      { key: "goals", label: "Goals" },
      { key: "notes_learned", label: "Notes" },
    ],
  },
  webster: {
    key: "webster",
    name: "Webster",
    role: "Fulfilment Advisor",
    agentId: WEBSTER_PROJECT_AGENT_ID,
    href: "/admin/meetings/webster",
    fields: [
      { key: "structure_choice", label: "Structure" },
      { key: "guide_outcome", label: "Outcome" },
      { key: "negotiation_requested", label: "Negotiation" },
      { key: "callback_phone", label: "Callback phone" },
    ],
  },
};

export type MeetingFieldValue = string | number | boolean | null;

export type MeetingTurn = { role: "agent" | "user"; message: string; timeInCallSecs: number | null };

export type ValidContact = { kind: "phone" | "email"; value: string };

export type Meeting = {
  id: string;
  bot: MeetingBotKey;
  startUnix: number | null;
  durationSecs: number | null;
  status: string | null;
  callSuccessful: string | null;
  title: string | null;
  summary: string | null;
  fields: Record<string, MeetingFieldValue>;
  callerName: string | null;
  /** Raw contact text the bot collected (may be junk; see `validContact`). */
  contactRaw: string | null;
  validContact: ValidContact | null;
  callbackTime: string | null;
  transcript: MeetingTurn[];
};

export type MeetingsResult =
  | { ok: true; meetings: Meeting[] }
  | { ok: false; reason: "missing-key" | "error"; message: string; meetings: Meeting[] };

type FetchLike = (input: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;

export type FetchMeetingsOptions = {
  apiKey?: string | null;
  fetchImpl?: FetchLike;
  pageSize?: number;
  /** Max detail requests in flight at once. */
  concurrency?: number;
};

// ---------------------------------------------------------------- contacts

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

/** A real phone number (10–15 digits) or email in `raw`, or null for junk like "XYZ XYZ". */
export function validateContact(raw: unknown): ValidContact | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;
  const email = text.match(EMAIL_RE);
  if (email) return { kind: "email", value: email[0] };
  const phone = text.match(PHONE_RE);
  if (phone) {
    const digits = phone[0].replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) return { kind: "phone", value: phone[0].trim() };
  }
  return null;
}

// ---------------------------------------------------------------- parsing

function str(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function fieldValue(v: unknown): MeetingFieldValue {
  if (typeof v === "boolean") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "true") return true;
    if (t === "false") return false;
    return t ? t : null;
  }
  return null;
}

type RawDetail = Record<string, unknown>;

/** data_collection_results arrives as a map (REST) or a list (some clients); accept both. */
function readDataCollection(analysis: Record<string, unknown> | null): Record<string, MeetingFieldValue> {
  const out: Record<string, MeetingFieldValue> = {};
  if (!analysis) return out;
  const map = analysis.data_collection_results;
  if (map && typeof map === "object" && !Array.isArray(map)) {
    for (const [key, entry] of Object.entries(map as Record<string, unknown>)) {
      const value = entry && typeof entry === "object" ? (entry as Record<string, unknown>).value : entry;
      out[key] = fieldValue(value);
    }
  }
  const list = analysis.data_collection_results_list;
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const key = str(e.data_collection_id) ?? str(e.name);
      if (key && !(key in out)) out[key] = fieldValue(e.value);
    }
  }
  return out;
}

function readTranscript(raw: unknown): MeetingTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: MeetingTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const r = t as Record<string, unknown>;
    const message = str(r.message);
    if (!message) continue;
    turns.push({ role: r.role === "user" ? "user" : "agent", message, timeInCallSecs: num(r.time_in_call_secs) });
  }
  return turns;
}

/** Turn one GET /v1/convai/conversations/{id} body (plus its list row) into a Meeting. */
export function parseMeeting(bot: MeetingBotKey, detail: RawDetail, listRow: RawDetail = {}): Meeting {
  const metadata = (detail.metadata && typeof detail.metadata === "object" ? detail.metadata : {}) as Record<string, unknown>;
  const analysis = (detail.analysis && typeof detail.analysis === "object" ? detail.analysis : null) as Record<string, unknown> | null;
  const fields = readDataCollection(analysis);
  const contactCandidates = [fields.contact, fields.email, fields.callback_phone, fields.phone];
  const contactRaw = contactCandidates.map(str).find(Boolean) ?? null;
  const validContact = contactCandidates.map(validateContact).find(Boolean) ?? null;
  return {
    id: str(detail.conversation_id) ?? str(listRow.conversation_id) ?? "",
    bot,
    startUnix: num(metadata.start_time_unix_secs) ?? num(listRow.start_time_unix_secs),
    durationSecs: num(metadata.call_duration_secs) ?? num(listRow.call_duration_secs),
    status: str(detail.status) ?? str(listRow.status),
    callSuccessful: str(analysis?.call_successful) ?? str(listRow.call_successful),
    title: str(analysis?.call_summary_title) ?? str(listRow.call_summary_title),
    summary: str(analysis?.transcript_summary) ?? str(listRow.transcript_summary),
    fields,
    callerName: str(fields.caller_name) ?? str(fields.name),
    contactRaw,
    validContact,
    callbackTime: str(fields.callback_time),
    transcript: readTranscript(detail.transcript),
  };
}

// ---------------------------------------------------------------- fetching

async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Newest first, read-only: list a bot's conversations, then fetch each one's details. */
export async function fetchBotMeetings(bot: MeetingBotKey, options: FetchMeetingsOptions = {}): Promise<MeetingsResult> {
  const apiKey = (options.apiKey === undefined ? process.env.ELEVENLABS_API_KEY : options.apiKey)?.trim();
  if (!apiKey) {
    return {
      ok: false,
      reason: "missing-key",
      message: "The ElevenLabs connection isn’t set up yet. Add ELEVENLABS_API_KEY for the Tsplits™ workspace to see calls here.",
      meetings: [],
    };
  }
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const init = { headers: { "xi-api-key": apiKey, accept: "application/json" }, next: { revalidate: MEETINGS_REVALIDATE_SECS } };
  const agentId = MEETING_BOTS[bot].agentId;
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50));

  try {
    const listUrl = `${ELEVENLABS_API_BASE}/v1/convai/conversations?agent_id=${encodeURIComponent(agentId)}&page_size=${pageSize}`;
    const listRes = await doFetch(listUrl, init);
    if (!listRes.ok) throw new Error(`ElevenLabs returned ${listRes.status} for the call list.`);
    const listBody = (await listRes.json()) as { conversations?: RawDetail[] };
    const rows = (listBody.conversations ?? []).filter((r) => str(r?.conversation_id));

    const meetings = await mapLimit(rows, options.concurrency ?? 8, async (row) => {
      const id = str(row.conversation_id)!;
      try {
        const res = await doFetch(`${ELEVENLABS_API_BASE}/v1/convai/conversations/${encodeURIComponent(id)}`, init);
        if (!res.ok) return parseMeeting(bot, {}, row);
        return parseMeeting(bot, (await res.json()) as RawDetail, row);
      } catch {
        return parseMeeting(bot, {}, row);
      }
    });
    return { ok: true, meetings: sortNewestFirst(meetings) };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Could not load calls from ElevenLabs.",
      meetings: [],
    };
  }
}

export async function fetchAllMeetings(options: FetchMeetingsOptions = {}) {
  const [aisha, webster] = await Promise.all([fetchBotMeetings("aisha", options), fetchBotMeetings("webster", options)]);
  return { aisha, webster };
}

export function sortNewestFirst(meetings: readonly Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => (b.startUnix ?? 0) - (a.startUnix ?? 0));
}

// ---------------------------------------------------------------- follow ups & to-dos

/** Calls where a real phone number or email was collected, newest first. */
export function followUpsFrom(meetings: readonly Meeting[]): Meeting[] {
  return sortNewestFirst(meetings.filter((m) => m.validContact));
}

export type MeetingTodo = {
  id: string;
  kind: "callback" | "negotiation" | "agent-code";
  title: string;
  detail: string | null;
  meeting: Meeting;
};

/**
 * Open items derived from calls (no DB): callbacks with a real contact,
 * negotiation requests, and prospects who said they will register.
 */
export function todosFrom(meetings: readonly Meeting[]): MeetingTodo[] {
  const todos: MeetingTodo[] = [];
  for (const m of sortNewestFirst(meetings)) {
    const who = m.callerName ?? "the caller";
    const bot = MEETING_BOTS[m.bot].name;
    const outcome = str(m.fields.guide_outcome);
    if (m.validContact && outcome !== "register" && outcome !== "not_interested") {
      todos.push({
        id: `${m.id}:callback`,
        kind: "callback",
        title: `Call back ${who} (${m.validContact.value})`,
        detail: [m.callbackTime ? `Best time: ${m.callbackTime}` : null, `From ${bot}`].filter(Boolean).join(" · "),
        meeting: m,
      });
    }
    if (m.fields.negotiation_requested === true) {
      const structure = str(m.fields.structure_choice);
      todos.push({
        id: `${m.id}:negotiation`,
        kind: "negotiation",
        title: `Review negotiation request from ${who}`,
        detail: [structure ? `Structure: ${humanize(structure)}` : null, `From ${bot}`].filter(Boolean).join(" · "),
        meeting: m,
      });
    }
    if (outcome === "register") {
      todos.push({
        id: `${m.id}:agent-code`,
        kind: "agent-code",
        title: `Agent Code for ${who} (registering)`,
        detail: [m.validContact ? m.validContact.value : "No valid contact given", `From ${bot}`].join(" · "),
        meeting: m,
      });
    }
  }
  return todos;
}

// ---------------------------------------------------------------- formatting

export function humanize(value: MeetingFieldValue): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replace(/_/g, " ");
}

export function formatMeetingTime(unix: number | null, timeZone: string = MEETINGS_TIME_ZONE): string {
  if (!unix) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unix * 1000));
}

export function formatDuration(secs: number | null): string {
  if (secs === null || secs < 0) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/** Calls today (Asia/Kolkata calendar day) and in the last 7 days. */
export function meetingCounts(meetings: readonly Meeting[], now: Date = new Date()) {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: MEETINGS_TIME_ZONE }).format(d);
  const today = day(now);
  const weekAgo = now.getTime() / 1000 - 7 * 24 * 3600;
  let todayCount = 0;
  let week = 0;
  for (const m of meetings) {
    if (!m.startUnix) continue;
    if (day(new Date(m.startUnix * 1000)) === today) todayCount++;
    if (m.startUnix >= weekAgo) week++;
  }
  return { today: todayCount, week };
}
