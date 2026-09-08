export function isAllowedAgentPhotoUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  return (
    host.endsWith(".supabase.co") ||
    host.endsWith(".supabase.in")
  );
}

export function agentPhotoProxyHref(sourceUrl: string): string {
  return `/api/mapsite/agent-photo?url=${encodeURIComponent(sourceUrl)}`;
}
