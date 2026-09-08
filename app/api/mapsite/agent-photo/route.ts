import {
  agentPhotoProxyHref,
  isAllowedAgentPhotoUrl,
} from "@/lib/mapsite/agent-photo-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim() || "";
  if (!isAllowedAgentPhotoUrl(url)) {
    return new Response("Photo URL is not allowed.", { status: 400 });
  }

  const upstream = await fetch(url, {
    cache: "force-cache",
    headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,image/*" },
  });
  if (!upstream.ok) {
    return new Response("Agent photo is unavailable.", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
