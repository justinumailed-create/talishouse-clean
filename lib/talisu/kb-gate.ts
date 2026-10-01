/** Client-side Knowledge Base unlock key (session persists until cleared). */
export const TALISU_KB_UNLOCK_STORAGE_KEY = "talisu_kb_unlocked_v1";

/** Exact password for the TalisU™ Knowledge Base gate. */
export const TALISU_KB_PASSWORD = "Admin123";

/** Query flag that opens the TalisU navbar KB unlock drop-pop. */
export const TALISU_KB_UNLOCK_QUERY = "kbUnlock";

/** Query key for post-unlock destination (e.g. /talisu/kb or /talisu/kb/manage). */
export const TALISU_KB_NEXT_QUERY = "kbNext";

export function isTalisUKbPassword(candidate: string): boolean {
  return candidate === TALISU_KB_PASSWORD;
}

export function readTalisUKbUnlocked(): boolean {
  try {
    return sessionStorage.getItem(TALISU_KB_UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeTalisUKbUnlocked(): void {
  try {
    sessionStorage.setItem(TALISU_KB_UNLOCK_STORAGE_KEY, "1");
  } catch {
    // Still treat as unlocked for this page load if storage is unavailable.
  }
}

/**
 * Send locked visitors to /talisu with the navbar unlock drop-pop open.
 * `nextPath` is where they land after a successful Unlock.
 */
export function buildTalisUKbUnlockHref(nextPath: string): string {
  const params = new URLSearchParams();
  params.set(TALISU_KB_UNLOCK_QUERY, "1");
  params.set(TALISU_KB_NEXT_QUERY, nextPath || "/talisu/kb");
  return `/talisu?${params.toString()}`;
}
