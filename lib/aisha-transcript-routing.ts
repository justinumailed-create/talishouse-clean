/**
 * Pure rules for routing new Aisha call transcripts to Rishav.
 * No database, no ElevenLabs, no Next.js — safe to unit test.
 *
 * A transcript is routed only when all of these hold:
 *   1. It is an Aisha call (not Webster or another bot).
 *   2. It started at or after AISHA_RISHAV_ROUTING_CUTOFF (new calls only).
 *   3. The call has ended (not in progress / initiated / processing).
 *   4. A human caller actually spoke (non-empty user turn).
 *   5. The caller is not a known internal tester (Aritri, Enanko, internal team).
 *   6. The call is not marked as a test (flags, title, summary, or name).
 *
 * Registration is not a filter: real unregistered callers and real registered
 * (around or after registration) callers both qualify, as long as they are
 * not internal testers. An unknown unregistered caller with no tester match
 * qualifies.
 */

import {
  AISHA_INTERNAL_TESTERS,
  matchInternalTester,
  type InternalTester,
} from "./aisha-internal-testers";

/** Inclusive cutoff: 5:00 PM IST on 26 Nov 2026, when this routing was set up. */
export const AISHA_RISHAV_ROUTING_CUTOFF_ISO = "2026-11-26T17:00:00+05:30";
export const AISHA_RISHAV_ROUTING_CUTOFF_UNIX = Math.floor(
  Date.parse(AISHA_RISHAV_ROUTING_CUTOFF_ISO) / 1000,
);

export const AISHA_CALL_SOURCE = "Aisha Call";
export const AISHA_TRANSCRIPTS_SCOPE = "aisha-transcripts" as const;

const ENDED_STATUSES = new Set(["done", "completed", "ended", "complete", "finished"]);
const OPEN_STATUSES = new Set([
  "initiated",
  "in-progress",
  "in_progress",
  "inprogress",
  "processing",
  "ongoing",
  "queued",
  "pending",
  "started",
]);

const TEST_FLAG_KEYS = [
  "is_test",
  "isTest",
  "test_call",
  "testCall",
  "testing",
  "test",
  "internal_test",
  "internalTest",
];

export type RoutingTranscriptTurn = {
  role: string;
  message: string;
};

export type AishaRoutingInput = {
  bot?: string | null;
  conversationId: string;
  status?: string | null;
  startUnix?: number | null;
  transcript?: readonly RoutingTranscriptTurn[];
  callerName?: string | null;
  email?: string | null;
  phone?: string | null;
  loginId?: string | null;
  title?: string | null;
  summary?: string | null;
  fields?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  testers?: readonly InternalTester[];
};

export type AishaRoutingExclusion =
  | "not-aisha"
  | "missing-id"
  | "pre-cutoff"
  | "missing-start"
  | "not-ended"
  | "no-human-speech"
  | "internal-tester"
  | "test-marker";

export type AishaRoutingDecision = {
  route: boolean;
  reasons: string[];
  exclusion: AishaRoutingExclusion | null;
  testerId: string | null;
};

function norm(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown): string {
  return norm(value).toLowerCase();
}

export function isEndedAishaCallStatus(status: string | null | undefined): boolean {
  const s = lower(status);
  if (!s) return false;
  if (OPEN_STATUSES.has(s)) return false;
  return ENDED_STATUSES.has(s);
}

export function hasHumanCallerSpeech(transcript: readonly RoutingTranscriptTurn[] | undefined): boolean {
  return (transcript ?? []).some((turn) => lower(turn.role) === "user" && norm(turn.message).length > 0);
}

function flagIsTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true;
  const s = lower(value);
  return s === "true" || s === "1" || s === "yes" || s === "test";
}

function objectHasTestFlag(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj) return false;
  for (const key of TEST_FLAG_KEYS) {
    if (key in obj && flagIsTruthy(obj[key])) return true;
  }
  return false;
}

const TEST_TEXT_RE = /\b(test(\s|-)?(call|user|caller|transcript)?|testing|qa tester|internal tester)\b/i;

export function hasExplicitTestMarker(input: AishaRoutingInput): boolean {
  if (objectHasTestFlag(input.fields) || objectHasTestFlag(input.metadata)) return true;
  const texts = [input.callerName, input.title, input.summary, input.loginId];
  if (texts.some((t) => t && TEST_TEXT_RE.test(String(t)))) return true;
  const fields = input.fields ?? {};
  for (const key of ["account_type_interest", "notes_learned", "goals", "business_type"]) {
    const value = fields[key];
    if (typeof value === "string" && TEST_TEXT_RE.test(value)) return true;
  }
  return false;
}

export function isAishaBot(bot: string | null | undefined): boolean {
  const s = lower(bot);
  return !s || s === "aisha";
}

export function evaluateAishaTranscriptRouting(input: AishaRoutingInput): AishaRoutingDecision {
  const reasons: string[] = [];
  if (!norm(input.conversationId)) {
    return { route: false, reasons: ["missing conversation id"], exclusion: "missing-id", testerId: null };
  }
  if (!isAishaBot(input.bot)) {
    return { route: false, reasons: ["not an Aisha call"], exclusion: "not-aisha", testerId: null };
  }
  if (input.startUnix == null || !Number.isFinite(input.startUnix)) {
    return { route: false, reasons: ["missing start time"], exclusion: "missing-start", testerId: null };
  }
  if (input.startUnix < AISHA_RISHAV_ROUTING_CUTOFF_UNIX) {
    return {
      route: false,
      reasons: [`started before cutoff ${AISHA_RISHAV_ROUTING_CUTOFF_ISO}`],
      exclusion: "pre-cutoff",
      testerId: null,
    };
  }
  if (!isEndedAishaCallStatus(input.status)) {
    return { route: false, reasons: ["call has not ended"], exclusion: "not-ended", testerId: null };
  }
  if (!hasHumanCallerSpeech(input.transcript)) {
    return {
      route: false,
      reasons: ["no human caller speech"],
      exclusion: "no-human-speech",
      testerId: null,
    };
  }
  const tester = matchInternalTester(
    {
      callerName: input.callerName,
      email: input.email,
      phone: input.phone,
      loginId: input.loginId,
    },
    input.testers ?? AISHA_INTERNAL_TESTERS,
  );
  if (tester) {
    return {
      route: false,
      reasons: [`internal tester: ${tester.id}`],
      exclusion: "internal-tester",
      testerId: tester.id,
    };
  }
  if (hasExplicitTestMarker(input)) {
    return { route: false, reasons: ["explicit test marker"], exclusion: "test-marker", testerId: null };
  }
  reasons.push("new ended Aisha call with human speech");
  reasons.push("caller is not a known internal tester");
  return { route: true, reasons, exclusion: null, testerId: null };
}

export function meetingToRoutingInput(meeting: {
  id: string;
  bot?: string | null;
  status?: string | null;
  startUnix?: number | null;
  transcript?: readonly RoutingTranscriptTurn[];
  callerName?: string | null;
  validContact?: { kind: "phone" | "email"; value: string } | null;
  contactRaw?: string | null;
  title?: string | null;
  summary?: string | null;
  fields?: Record<string, unknown> | null;
}): AishaRoutingInput {
  const fields = meeting.fields ?? {};
  const emailFromContact = meeting.validContact?.kind === "email" ? meeting.validContact.value : null;
  const phoneFromContact = meeting.validContact?.kind === "phone" ? meeting.validContact.value : null;
  return {
    bot: meeting.bot,
    conversationId: meeting.id,
    status: meeting.status,
    startUnix: meeting.startUnix,
    transcript: meeting.transcript,
    callerName: meeting.callerName ?? (typeof fields.caller_name === "string" ? fields.caller_name : null),
    email:
      emailFromContact ??
      (typeof fields.email === "string" ? fields.email : null) ??
      (typeof fields.contact === "string" && fields.contact.includes("@") ? String(fields.contact) : null),
    phone:
      phoneFromContact ??
      (typeof fields.phone === "string" ? fields.phone : null) ??
      (typeof fields.callback_phone === "string" ? fields.callback_phone : null) ??
      (typeof fields.contact === "string" && !String(fields.contact).includes("@") ? String(fields.contact) : null),
    loginId: typeof fields.login_id === "string" ? fields.login_id : typeof fields.loginId === "string" ? fields.loginId : null,
    title: meeting.title,
    summary: meeting.summary,
    fields,
  };
}
