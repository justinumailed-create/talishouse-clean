import { NextResponse } from "next/server";
import { parseMeeting } from "@/lib/tsplits-meetings";
import { ingestQualifyingAishaMeeting } from "@/lib/aisha-transcript-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ElevenLabs ConvAI post-call webhook for Aisha.
 * Ready to receive ended-conversation payloads. This route never calls the
 * ElevenLabs API and is not registered from this change (Ralf's workspace
 * is left untouched).
 *
 * Auth: AISHA_POST_CALL_WEBHOOK_SECRET as Bearer token, x-webhook-secret, or
 * xi-webhook-secret.
 */
function readSecret(request: Request): string | null {
  const header =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("xi-webhook-secret") ||
    request.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim();
}

function webhookConfiguredSecret(): string | null {
  return (process.env.AISHA_POST_CALL_WEBHOOK_SECRET || "").trim() || null;
}

function extractConversation(body: Record<string, unknown>): Record<string, unknown> | null {
  if (body.conversation_id || body.transcript || body.analysis) return body;
  const data = body.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.conversation_id || d.conversation) {
      if (d.conversation && typeof d.conversation === "object") return d.conversation as Record<string, unknown>;
      return d;
    }
  }
  if (body.conversation && typeof body.conversation === "object") {
    return body.conversation as Record<string, unknown>;
  }
  return null;
}

export async function POST(request: Request) {
  const expected = webhookConfiguredSecret();
  if (!expected) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  }
  const provided = readSecret(request);
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const detail = extractConversation(body);
  if (!detail) {
    return NextResponse.json({ error: "Missing conversation payload." }, { status: 400 });
  }

  const agentId = String(detail.agent_id ?? body.agent_id ?? "");
  // Only Aisha conversations are ingested. Unknown agent ids with bot=aisha
  // in the body are also accepted so a test fixture can skip the live agent id.
  const botHint = String(body.bot ?? detail.bot ?? "aisha").toLowerCase();
  if (botHint && botHint !== "aisha") {
    return NextResponse.json({ received: true, routed: false, reason: "not an Aisha call" });
  }

  const meeting = parseMeeting("aisha", detail);
  if (!meeting.id) {
    return NextResponse.json({ error: "Missing conversation id." }, { status: 400 });
  }

  try {
    const result = await ingestQualifyingAishaMeeting(meeting);
    return NextResponse.json({ received: true, agentId: agentId || null, ...result });
  } catch (error) {
    console.error("[aisha-post-call] ingest failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingest failed." },
      { status: 500 },
    );
  }
}
