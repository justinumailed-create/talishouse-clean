/** First sentence stays medium; the rest stays regular. The words do not change. */
export function aishaInvitationParts(line: string): { lead: string; rest: string } {
  const match = /^(.+?[.!?])\s+([\s\S]+)$/.exec(line);
  if (!match?.[1] || !match[2]) return { lead: line, rest: "" };
  return { lead: match[1], rest: match[2] };
}
