/**
 * Identifier colours for audio transcript speaker labels (site-wide).
 * Aisha → Orange; Webster → Blue; Ralf → Blue when the male track
 * is the same person, or a distinct teal when both Webster and Ralf
 * appear as separate labeled speakers in the same transcript.
 */

export const TALISU_SPEAKER_AISHA_COLOR = "#EA580C"; // orange-600
export const TALISU_SPEAKER_WEBSTER_COLOR = "#046BD9"; // brand blue
/** Distinct male-track colour when Webster and Ralf both appear. */
export const TALISU_SPEAKER_RALF_DISTINCT_COLOR = "#0D9488"; // teal-600
export const TALISU_SPEAKER_FALLBACK_COLOR = "#525252"; // neutral-600

export type ParsedTranscriptLine = {
  speaker: string | null;
  text: string;
  /** Full original line (for keys / plain fallback). */
  raw: string;
};

const SPEAKER_LINE_RE = /^([A-Za-z][A-Za-z .'-]{0,40}):\s*(.*)$/;

export function parseTranscriptLine(line: string): ParsedTranscriptLine {
  const match = line.match(SPEAKER_LINE_RE);
  if (!match) {
    return { speaker: null, text: line, raw: line };
  }
  return { speaker: match[1].trim(), text: match[2], raw: line };
}

export function collectTranscriptSpeakers(lines: readonly string[]): Set<string> {
  const speakers = new Set<string>();
  for (const line of lines) {
    const { speaker } = parseTranscriptLine(line);
    if (speaker) speakers.add(speaker);
  }
  return speakers;
}

function hasSpeakerNamed(speakers: Set<string>, name: string): boolean {
  const needle = name.toLowerCase();
  for (const s of speakers) {
    if (s.toLowerCase() === needle) return true;
  }
  return false;
}

/**
 * Resolve label colour for a speaker given who appears in the transcript.
 */
export function speakerLabelColor(
  speaker: string,
  presentSpeakers: Set<string> = new Set(),
): string {
  const key = speaker.trim().toLowerCase();
  if (key === "aisha") return TALISU_SPEAKER_AISHA_COLOR;
  if (key === "webster") return TALISU_SPEAKER_WEBSTER_COLOR;
  if (key === "ralf") {
    // Same male track → Blue; distinct only when Webster + Ralf both labeled.
    if (hasSpeakerNamed(presentSpeakers, "webster")) {
      return TALISU_SPEAKER_RALF_DISTINCT_COLOR;
    }
    return TALISU_SPEAKER_WEBSTER_COLOR;
  }
  return TALISU_SPEAKER_FALLBACK_COLOR;
}

/** Tailwind-friendly class for the speaker name span (uses style colour). */
export const TALISU_SPEAKER_LABEL_CLASS =
  "font-semibold not-italic";
