export type TranscriptPart =
  | { kind: "text"; text: string }
  | { kind: "link" };

const SITE =
  /(?:https?:\/\/)?(?:www\.)?tsplits\.com(?:[/?#][^\s]*)?/gi;
const BRAND = /\bT-?splits\b/gi;
const TRAILING = /[.,;:!?)\]"']+$/;

/** Voice emotion tags such as [happy] are shown as an emoji. */
const TAG_EMOJI: Record<string, string> = {
  happy: "😊",
  cheerful: "😊",
  warm: "🙂",
  friendly: "🙂",
  calm: "🙂",
  excited: "🤩",
  enthusiastic: "🤩",
  laughs: "😄",
  laughing: "😄",
  chuckles: "😄",
  giggles: "😄",
  curious: "🤔",
  thoughtful: "🤔",
  thinking: "🤔",
  surprised: "😮",
  sad: "😔",
  sighs: "😌",
  relieved: "😌",
  whispers: "🤫",
  confident: "😎",
  proud: "😎",
};
const TAG = /\[([a-z][a-z \-]*)\]\s?/gi;
const OPEN_TAG = /\[[a-z \-]*$/i;
const TALIS_TV = /\bTalis[\s-]*T-?V\b/gi;

/** Emotion tags become emojis, and "Talis T-V" is written TalisTV. */
export function displayText(text: string): string {
  return text
    .replace(TAG, (_, name: string) => {
      const emoji = TAG_EMOJI[name.trim().toLowerCase()];
      return emoji ? `${emoji} ` : "";
    })
    .replace(OPEN_TAG, "")
    .replace(TALIS_TV, "TalisTV");
}

function trimTail(raw: string): string {
  return raw.replace(TRAILING, "");
}

/**
 * Display rules for an agent transcript line.
 * A website mention becomes the link text "tsplits.com".
 * A bare brand becomes "Tsplits™" without a second mark.
 * The spoken audio is left unchanged.
 */
export function transcriptParts(raw: string): TranscriptPart[] {
  const text = displayText(raw);
  type Span = { start: number; end: number; kind: "link" | "brand" };
  const spans: Span[] = [];

  for (const match of text.matchAll(SITE)) {
    const start = match.index ?? 0;
    const raw = trimTail(match[0]);
    if (!raw) continue;
    spans.push({ start, end: start + raw.length, kind: "link" });
  }

  for (const match of text.matchAll(BRAND)) {
    const start = match.index ?? 0;
    let end = start + match[0].length;
    if (spans.some((span) => start < span.end && end > span.start)) continue;
    if (text.startsWith("™", end)) end += 1;
    spans.push({ start, end, kind: "brand" });
  }

  spans.sort((a, b) => a.start - b.start || a.end - b.end);

  const parts: TranscriptPart[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    if (span.start > cursor) {
      parts.push({ kind: "text", text: text.slice(cursor, span.start) });
    }
    parts.push(span.kind === "link" ? { kind: "link" } : { kind: "text", text: "Tsplits™" });
    cursor = span.end;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}
