/**
 * Personal home write-up formatting: bold, italic and underline only.
 * Markers: **bold**, *italic*, ++underline++.
 * Line and paragraph breaks are applied first so markers never swallow them.
 * HTML is never interpreted. Render with React elements, not innerHTML.
 */

export type WriteUpMark = "bold" | "italic" | "underline";

export type WriteUpInline =
  | { type: "text"; value: string }
  | { type: WriteUpMark; children: WriteUpInline[] };

export type WriteUpParagraph = WriteUpInline[][];

export type WriteUpDoc = {
  paragraphs: WriteUpParagraph[];
};

const MARKERS: Array<{ type: WriteUpMark; token: string }> = [
  { type: "bold", token: "**" },
  { type: "underline", token: "++" },
  { type: "italic", token: "*" },
];

/** Drop HTML/script tags, keeping inner text. Markers and line breaks stay. */
export function stripWriteUpHtml(value: string): string {
  return value.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

export function parseWriteUp(text: string): WriteUpDoc {
  const normalized = text.replace(/\r\n?/g, "\n");
  const rawParagraphs = normalized.split(/\n{2,}/);
  const paragraphs: WriteUpParagraph[] = [];
  for (const raw of rawParagraphs) {
    if (!raw.trim()) continue;
    const lines = raw.split("\n").map((line) => parseInline(line));
    paragraphs.push(lines);
  }
  return { paragraphs };
}

function parseInline(input: string): WriteUpInline[] {
  const out: WriteUpInline[] = [];
  let i = 0;
  while (i < input.length) {
    const match = findMarker(input, i);
    if (!match) {
      const next = nextMarkerIndex(input, i);
      const end = next === -1 ? input.length : next;
      const value = input.slice(i, end);
      if (value) out.push({ type: "text", value });
      i = end;
      continue;
    }
    if (match.start > i) {
      out.push({ type: "text", value: input.slice(i, match.start) });
    }
    out.push({
      type: match.type,
      children: parseInline(match.inner),
    });
    i = match.end;
  }
  return out;
}

function findMarker(
  input: string,
  from: number,
): { type: WriteUpMark; start: number; end: number; inner: string } | null {
  for (const { type, token } of MARKERS) {
    if (!input.startsWith(token, from)) continue;
    if (type === "italic" && input.startsWith("**", from)) continue;
    const close = input.indexOf(token, from + token.length);
    if (close === -1) continue;
    return {
      type,
      start: from,
      end: close + token.length,
      inner: input.slice(from + token.length, close),
    };
  }
  return null;
}

function nextMarkerIndex(input: string, from: number): number {
  let best = -1;
  for (const { type, token } of MARKERS) {
    if (type === "italic") {
      // Skip the first star of a bold marker; findMarker handles ** first.
    }
    let idx = input.indexOf(token, from);
    while (idx !== -1) {
      if (type === "italic" && input.startsWith("**", idx)) {
        idx = input.indexOf(token, idx + 2);
        continue;
      }
      const close = input.indexOf(token, idx + token.length);
      if (close !== -1) {
        best = best === -1 ? idx : Math.min(best, idx);
        break;
      }
      idx = input.indexOf(token, idx + 1);
    }
  }
  return best;
}

export function wrapWriteUpSelection(
  value: string,
  start: number,
  end: number,
  token: string,
): { value: string; start: number; end: number } {
  const from = Math.max(0, Math.min(start, end));
  const to = Math.max(0, Math.max(start, end));
  const selected = value.slice(from, to);
  if (
    selected.startsWith(token) &&
    selected.endsWith(token) &&
    selected.length >= token.length * 2
  ) {
    const inner = selected.slice(token.length, selected.length - token.length);
    return {
      value: value.slice(0, from) + inner + value.slice(to),
      start: from,
      end: from + inner.length,
    };
  }
  if (
    from >= token.length &&
    value.slice(from - token.length, from) === token &&
    value.slice(to, to + token.length) === token
  ) {
    return {
      value: value.slice(0, from - token.length) + selected + value.slice(to + token.length),
      start: from - token.length,
      end: from - token.length + selected.length,
    };
  }
  const next = value.slice(0, from) + token + selected + token + value.slice(to);
  return {
    value: next,
    start: from + token.length,
    end: from + token.length + selected.length,
  };
}

export const WRITE_UP_TOKENS = {
  bold: "**",
  italic: "*",
  underline: "++",
} as const;
