/**
 * Pure helpers for agent daily notes, presence, activity and chat.
 * No I/O here so it can be unit-tested and imported by client components.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";
/** An agent counts as online when a heartbeat arrived within this window. */
export const AGENT_ONLINE_WINDOW_MS = 90 * 1000;
export const AGENT_HEARTBEAT_MS = 30 * 1000;
export const AGENT_NOTE_MAX_CHARS = 5000;
export const AGENT_CHAT_MAX_CHARS = 4000;
export const AGENT_NOTE_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const AGENT_NOTES_BUCKET = "agent-notes";

export const AGENT_NOTE_FILE_TYPES: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date (YYYY-MM-DD) in India Standard Time. */
export function istDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function isValidDateString(value: string | null | undefined): value is string {
  if (!value || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** UTC instant for 00:00 IST on `date` (IST = UTC+05:30, no DST). */
export function istDayStartUtc(date: string): string {
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

/** UTC instant for the start of the day AFTER `date` in IST (exclusive bound). */
export function istDayEndUtc(date: string): string {
  return new Date(new Date(`${date}T00:00:00+05:30`).getTime() + 24 * 3600 * 1000).toISOString();
}

/** "12 Oct 2026, 5:18 PM IST". */
export function formatIst(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d)} IST`;
}

/** "5:18 PM" in IST. */
export function formatIstTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Notes are editable by their author only on the IST day they belong to. */
export function canEditNoteOn(noteDate: string, now: Date = new Date()): boolean {
  return noteDate === istDate(now);
}

export type PresenceInput = { lastSeenAt: string | null; signedOutAt: string | null };

export function isAgentOnline(p: PresenceInput | null | undefined, now: number = Date.now()): boolean {
  if (!p?.lastSeenAt) return false;
  const seen = new Date(p.lastSeenAt).getTime();
  if (Number.isNaN(seen) || now - seen > AGENT_ONLINE_WINDOW_MS) return false;
  if (p.signedOutAt && new Date(p.signedOutAt).getTime() >= seen) return false;
  return true;
}

/** "Online" or "Last seen 5:18 PM" / "Last seen 12 Oct 2026, 5:18 PM IST" / "Never signed in". */
export function presenceLabel(p: PresenceInput | null | undefined, now: Date = new Date()): string {
  if (isAgentOnline(p, now.getTime())) return "Online";
  const last = p?.signedOutAt && p?.lastSeenAt
    ? (new Date(p.signedOutAt) > new Date(p.lastSeenAt) ? p.signedOutAt : p.lastSeenAt)
    : p?.lastSeenAt ?? p?.signedOutAt ?? null;
  if (!last) return "Never signed in";
  return istDate(new Date(last)) === istDate(now)
    ? `Last seen today ${formatIstTime(last)}`
    : `Last seen ${formatIst(last)}`;
}

export type MessageTick = "sent" | "delivered" | "read";

/** Tick state of a message I sent, from the recipient's delivered/read watermarks. */
export function messageTick(
  createdAt: string,
  recipientDeliveredAt: string | null | undefined,
  recipientReadAt: string | null | undefined,
): MessageTick {
  const t = new Date(createdAt).getTime();
  if (recipientReadAt && new Date(recipientReadAt).getTime() >= t) return "read";
  if (recipientDeliveredAt && new Date(recipientDeliveredAt).getTime() >= t) return "delivered";
  return "sent";
}

export function chatPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function cleanFileName(name: string): string {
  const base = String(name || "").split(/[\\/]/).pop() || "file";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\s+/g, " ").trim().slice(-120);
  return cleaned || "file";
}

export type NoteFileCheck = { ok: true; mimeType: string; fileName: string } | { ok: false; error: string };

export function validateNoteFile(input: { name: string; size: number; type?: string | null }): NoteFileCheck {
  const fileName = cleanFileName(input.name);
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  const mimeType = AGENT_NOTE_FILE_TYPES[ext];
  if (!mimeType) {
    return { ok: false, error: "Allowed files: PDF, JPG, PNG, WEBP, TXT, CSV, DOC(X), XLS(X)." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) return { ok: false, error: "The file is empty." };
  if (input.size > AGENT_NOTE_FILE_MAX_BYTES) return { ok: false, error: "Files must be 10 MB or smaller." };
  return { ok: true, mimeType, fileName };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Activity log action types shown in the superadmin filter (label per action). */
export const AGENT_ACTIVITY_LABELS: Readonly<Record<string, string>> = {
  "agent.login": "Signed in",
  "agent.logout": "Signed out",
  "agent.session.expired": "Session expired",
  "agent.login.locked": "Locked (failed logins)",
  "agent.password.change": "Changed password",
  "agent.mapsite.edit": "Mapsite edit",
  "agent.ebook.edit": "eBook edit",
  agent_pins_added: "PINs added",
  agent_cash_payment_recorded: "Cash payment recorded",
  agent_cash_payment_reversed: "Cash payment reversed",
  "agent.note.create": "Daily note added",
  "agent.note.update": "Daily note edited",
  "agent.note.upload": "Document uploaded",
};

export function activityLabel(action: string): string {
  return AGENT_ACTIVITY_LABELS[action] ?? action;
}

/** Strip anything chat-related from an activity details object (defence in depth). */
export function redactActivityDetails(details: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details ?? {})) {
    if (/message|chat|body|content|text/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}
