export type SpokenLine = {
  id: string;
  role: "user" | "agent";
  text: string;
};

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** What the visitor said. Shown as soon as it is transcribed. */
export function addUserLine(lines: SpokenLine[], text: string): SpokenLine[] {
  const value = clean(text);
  if (!value) return lines;
  const last = lines[lines.length - 1];
  if (last?.role === "user" && last.text === value) return lines;
  return [...lines, { id: `user-${lines.length}`, role: "user", text: value }];
}

/**
 * Characters that have actually started playing.
 * A new agent line starts after a user line, or when the previous turn closed.
 */
export function appendPlayedChars(
  lines: SpokenLine[],
  chars: string,
  turnOpen: boolean,
): { lines: SpokenLine[]; turnOpen: boolean } {
  if (!chars) return { lines, turnOpen };
  const last = lines[lines.length - 1];
  if (turnOpen && last?.role === "agent") {
    const next = lines.slice();
    next[next.length - 1] = { ...last, text: last.text + chars };
    return { lines: next, turnOpen: true };
  }
  return {
    lines: [...lines, { id: `agent-${lines.length}`, role: "agent", text: chars }],
    turnOpen: true,
  };
}
