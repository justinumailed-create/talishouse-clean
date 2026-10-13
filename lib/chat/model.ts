/** Pure helpers shared by the /chat client and server (no server imports). */
import { formatIst, formatIstTime, istDate } from "../agent-collab";

export const CHAT_MAX_CHARS = 4000;
export const CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_FILES_BUCKET = "agent-chat-files";
export const CHAT_POLL_MS = 3000;
export const CHAT_TYPING_TTL_MS = 6000;
export const CHAT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const CHAT_REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "🙏"] as const;

export const CHAT_FILE_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  pdf: "application/pdf", txt: "text/plain", csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export type ChatTick = "sent" | "delivered" | "read";

/** single grey = sent, double grey = delivered, double blue = read */
export function chatTick(m: { deliveredAt: string | null; readAt: string | null }): ChatTick {
  if (m.readAt) return "read";
  if (m.deliveredAt) return "delivered";
  return "sent";
}

export function dmPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function cleanChatBody(raw: unknown): string {
  return String(raw ?? "").replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
}

export function isAllowedReaction(e: unknown): e is string {
  return typeof e === "string" && (CHAT_REACTIONS as readonly string[]).includes(e);
}

export function cleanChatFileName(name: string): string {
  const base = String(name || "file").split(/[\\/]/).pop() || "file";
  return base.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\s+/g, "_").slice(-100) || "file";
}

export type ChatFileCheck = { ok: true; mimeType: string; fileName: string } | { ok: false; error: string };

export function validateChatFile(f: { name: string; size: number }): ChatFileCheck {
  const fileName = cleanChatFileName(f.name);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = CHAT_FILE_TYPES[ext];
  if (!mimeType) return { ok: false, error: "That file type is not allowed." };
  if (!(f.size > 0)) return { ok: false, error: "The file is empty." };
  if (f.size > CHAT_FILE_MAX_BYTES) return { ok: false, error: "Files must be 10 MB or smaller." };
  return { ok: true, mimeType, fileName };
}

export function isImageMime(m: string | null | undefined): boolean {
  return Boolean(m && m.startsWith("image/"));
}

/** Escape LIKE wildcards for a contains-search. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Inbox time: "5:18 PM" today, else "12 Oct". */
export function inboxTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  if (istDate(new Date(iso)) === istDate(now)) return formatIstTime(iso);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(new Date(iso));
}

export function receiptTime(iso: string | null | undefined): string {
  return iso ? formatIst(iso) : "—";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Stable avatar colour from an id. */
export function avatarColor(id: string): string {
  const colors = ["#1E4ED8", "#0E9F6E", "#9333EA", "#DB2777", "#EA580C", "#0891B2", "#4F46E5", "#B45309"];
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export function canEditMessage(m: { mine: boolean; deletedAt: string | null; createdAt: string }, now = Date.now()): boolean {
  return m.mine && !m.deletedAt && now - new Date(m.createdAt).getTime() < CHAT_EDIT_WINDOW_MS;
}

/** In-memory sliding-window limiter (per server instance). */
export function makeLimiter(max: number, windowMs: number) {
  const log = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (log.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    log.set(key, recent);
    if (log.size > 5000) log.clear();
    return recent.length > max;
  };
}

export function messagePreview(m: { body: string; deletedAt: string | null; fileName: string | null; ebookTitle: string | null }): string {
  if (m.deletedAt) return "Message deleted";
  if (m.body) return m.body.replace(/\s+/g, " ").slice(0, 90);
  if (m.ebookTitle) return `📘 ${m.ebookTitle}`;
  if (m.fileName) return `📎 ${m.fileName}`;
  return "";
}
