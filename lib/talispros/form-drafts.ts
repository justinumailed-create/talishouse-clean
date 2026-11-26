/**
 * In-progress form drafts (Add Pin, listing links, associate lead forms).
 *
 * Associates often work several listings at once in separate browser tabs.
 * Each form keeps its unsaved input in localStorage, keyed by form scope and
 * the listing (FAST Code / Mapsite id), so returning to a tab or reopening the
 * listing resumes right where they left off. A draft is cleared on a
 * successful save or an explicit reset, and expires after FORM_DRAFT_TTL_MS.
 */

export type FormDraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type FormDraftValue = Record<string, string | number | boolean | null>;

export const FORM_DRAFT_PREFIX = "tsplits:draft:";

/** Drafts older than seven days are ignored and removed. */
export const FORM_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function formDraftKey(scope: string, id: string | null | undefined): string {
  const safeId = (id ?? "").trim().toLowerCase() || "default";
  return `${FORM_DRAFT_PREFIX}${scope}:${safeId}`;
}

export function browserFormDraftStorage(): FormDraftStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "" || value === false;
}

export function isEmptyFormDraft(value: FormDraftValue | null | undefined): boolean {
  if (!value) return true;
  return Object.values(value).every(isEmptyValue);
}

export function readFormDraft<T extends FormDraftValue>(
  key: string,
  storage: FormDraftStorage | null = browserFormDraftStorage(),
  now: number = Date.now(),
): Partial<T> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: unknown; value?: unknown };
    if (!parsed || typeof parsed !== "object") return null;
    const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
    if (!savedAt || now - savedAt > FORM_DRAFT_TTL_MS) {
      storage.removeItem(key);
      return null;
    }
    const value = parsed.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Partial<T>;
  } catch {
    return null;
  }
}

/** Saves the draft; an all-empty draft removes the key instead. */
export function writeFormDraft(
  key: string,
  value: FormDraftValue,
  storage: FormDraftStorage | null = browserFormDraftStorage(),
  now: number = Date.now(),
): void {
  if (!storage) return;
  try {
    if (isEmptyFormDraft(value)) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify({ savedAt: now, value }));
  } catch {
    // Storage full or blocked (private mode): drafts are best effort.
  }
}

export function clearFormDraft(
  key: string,
  storage: FormDraftStorage | null = browserFormDraftStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function draftString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
