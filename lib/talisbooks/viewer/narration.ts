import type {
  TalisBooksNarrationController,
  TalisBooksNarrationCue,
  TalisBooksNarrationTrack,
} from "./types";

/**
 * Narration stubs — keep the viewer ready for audio without integrating it.
 * Call sites can pass a controller later; defaults are no-ops.
 */

export function createEmptyNarrationController(): TalisBooksNarrationController {
  return {
    enabled: false,
    track: null,
    syncWithAutoTurn: false,
  };
}

export function getNarrationCueForPage(
  track: TalisBooksNarrationTrack | null | undefined,
  pageNumber: number,
): TalisBooksNarrationCue | null {
  if (!track) {
    return null;
  }
  return track.cues.find((cue) => cue.pageNumber === pageNumber) ?? null;
}

export function notifyNarrationPageEnter(
  controller: TalisBooksNarrationController | null | undefined,
  pageNumber: number,
): void {
  if (!controller?.enabled) {
    return;
  }
  controller.onPageEnter?.(pageNumber);
}

export function notifyNarrationPageLeave(
  controller: TalisBooksNarrationController | null | undefined,
  pageNumber: number,
): void {
  if (!controller?.enabled) {
    return;
  }
  controller.onPageLeave?.(pageNumber);
}
