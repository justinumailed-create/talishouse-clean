/**
 * Grey flag-link one-click actions (Ralf, Nov 27 item #8).
 *
 * Owners click a grey PIN-card link and get one simple action, never the
 * eBook editor:
 * - URL: paste and save the listing or website address (mls_url).
 * - TEB: attach a PDF (offered on the bookshelf next to the template files).
 * - TVA: attach a TEB summary (PDF or text file).
 * - TTV: a short notice that TTV needs additional setup.
 *
 * Attachments live in the public `mapsite-assets` bucket under one fixed
 * folder per FAST Code, so no database column or migration is needed.
 */

export type FlagAttachmentKind = "teb" | "tva";
export type GreyFlagAction = "url" | "teb" | "tva" | "ttv";

export const FLAG_ATTACHMENT_BUCKET = "mapsite-assets";
export const FLAG_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export const FLAG_ATTACHMENT_TYPES: Record<
  FlagAttachmentKind,
  { mimeTypes: readonly string[]; extensions: readonly string[]; accept: string }
> = {
  teb: {
    mimeTypes: ["application/pdf"],
    extensions: ["pdf"],
    accept: "application/pdf,.pdf",
  },
  tva: {
    mimeTypes: ["application/pdf", "text/plain", "text/markdown"],
    extensions: ["pdf", "txt", "md"],
    accept: "application/pdf,.pdf,text/plain,.txt,text/markdown,.md",
  },
};

export function isFlagAttachmentKind(value: unknown): value is FlagAttachmentKind {
  return value === "teb" || value === "tva";
}

/** Folder for a FAST Code's flag attachments (lowercase, safe characters only). */
export function flagAttachmentFolder(fastCode: string): string {
  const code = fastCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `flag-attachments/${code || "unknown"}`;
}

/** Object name prefix; the newest file with this prefix wins. */
export function flagAttachmentPrefix(kind: FlagAttachmentKind): string {
  return kind === "teb" ? "teb-pdf" : "tva-summary";
}

export function flagAttachmentPath(
  fastCode: string,
  kind: FlagAttachmentKind,
  extension: string,
  stamp = Date.now(),
): string {
  const ext = extension.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  return `${flagAttachmentFolder(fastCode)}/${flagAttachmentPrefix(kind)}-${stamp}.${ext}`;
}

/** Validate an uploaded file for a flag. Returns an error key or the extension. */
export function validateFlagAttachment(
  kind: FlagAttachmentKind,
  file: { name: string; type: string; size: number },
): { ok: true; extension: string } | { ok: false; reason: "type" | "size" | "empty" } {
  if (!file.size) return { ok: false, reason: "empty" };
  if (file.size > FLAG_ATTACHMENT_MAX_BYTES) return { ok: false, reason: "size" };
  const rules = FLAG_ATTACHMENT_TYPES[kind];
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const typeOk = rules.mimeTypes.includes(file.type) || rules.extensions.includes(extension);
  if (!typeOk || !rules.extensions.includes(extension)) return { ok: false, reason: "type" };
  return { ok: true, extension };
}

/**
 * Newest attachment of a kind from a storage listing (names carry a
 * millisecond stamp, so the largest stamp is the latest upload).
 */
export function newestFlagAttachmentName(
  names: ReadonlyArray<string>,
  kind: FlagAttachmentKind,
): string | null {
  const prefix = `${flagAttachmentPrefix(kind)}-`;
  let best: { name: string; stamp: number } | null = null;
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    const stamp = Number(name.slice(prefix.length).split(".")[0]);
    if (!Number.isFinite(stamp)) continue;
    if (!best || stamp > best.stamp) best = { name, stamp };
  }
  return best?.name ?? null;
}

/**
 * Which one-click action a grey flag opens. Only owners and editors get one;
 * visitors keep the hover message. A live (blue) link never opens an action.
 */
export function greyFlagActionFor(input: {
  flag: GreyFlagAction;
  live: boolean;
  canManage: boolean;
}): GreyFlagAction | null {
  if (input.live || !input.canManage) return null;
  return input.flag;
}
