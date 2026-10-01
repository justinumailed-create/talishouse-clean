/** Client-side Knowledge Base unlock key (session persists until cleared). */
export const TALISU_KB_UNLOCK_STORAGE_KEY = "talisu_kb_unlocked_v1";

/** Exact password for the TalisU™ Knowledge Base gate. */
export const TALISU_KB_PASSWORD = "Admin123";

/** CustomEvent: open the TalisU navbar KB unlock popover (stay on current page). */
export const TALISU_KB_OPEN_UNLOCK_EVENT = "talisu:open-kb-unlock";

/** CustomEvent: password succeeded — gates re-check session and show children. */
export const TALISU_KB_UNLOCKED_EVENT = "talisu:kb-unlocked";

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

export function requestTalisUKbNavbarUnlock(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TALISU_KB_OPEN_UNLOCK_EVENT));
}

export function notifyTalisUKbUnlocked(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TALISU_KB_UNLOCKED_EVENT));
}
