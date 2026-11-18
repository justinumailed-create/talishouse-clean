/** Set after a first-time visitor finishes a pitch call on this device. */
export const PITCH_DONE_KEY = "tsplits.pitch.done";

export const PITCH_DONE_EVENT = "tsplits-pitch-done";

export function readPitchDone(storage: Pick<Storage, "getItem"> | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(PITCH_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPitchDone(storage: Pick<Storage, "setItem"> | null): void {
  if (!storage) return;
  try {
    storage.setItem(PITCH_DONE_KEY, "1");
  } catch {
    return;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PITCH_DONE_EVENT));
  }
}
