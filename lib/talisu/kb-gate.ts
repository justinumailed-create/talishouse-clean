/** Client-side Knowledge Base unlock key (session persists until cleared). */
export const TALISU_KB_UNLOCK_STORAGE_KEY = "talisu_kb_unlocked_v1";

/** Exact password for the TalisU™ Knowledge Base gate. */
export const TALISU_KB_PASSWORD = "Admin123";

export function isTalisUKbPassword(candidate: string): boolean {
  return candidate === TALISU_KB_PASSWORD;
}
