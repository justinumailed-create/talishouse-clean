import { NextResponse, type NextRequest } from "next/server";
import {
  getCurrentAgent,
  listChatContacts,
  readChatThread,
  sendChatMessage,
  touchAgentPresence,
} from "@/lib/agent-collab-server";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Private agent chat. Only a signed-in agent can call this, and only for
 * conversations they are part of. There is deliberately no admin variant:
 * superadmins cannot read message content.
 *   GET            → contacts with presence + unread counts
 *   GET ?with=<id> → thread with that agent (&read=0 to not mark read)
 *   POST {to, body}→ send
 */
export async function GET(request: NextRequest) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  await touchAgentPresence(agent.agentId);
  const peer = request.nextUrl.searchParams.get("with");
  if (!peer) {
    return NextResponse.json({ contacts: await listChatContacts(agent) }, { headers: noStore });
  }
  const thread = await readChatThread(agent, peer, request.nextUrl.searchParams.get("read") !== "0");
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  return NextResponse.json({ thread }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  let payload: { to?: unknown; body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  }
  const result = await sendChatMessage(agent, String(payload.to ?? ""), String(payload.body ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: noStore });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
