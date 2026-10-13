import { NextResponse } from "next/server";
import { getCurrentAgent, touchAgentPresence } from "@/lib/agent-collab-server";
import { countUnreadForAgent } from "@/lib/chat/server";

export const dynamic = "force-dynamic";

/** Presence heartbeat from an open agent console tab (agent_session cookie auth). */
export async function POST() {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  await touchAgentPresence(agent.agentId);
  const unread = await countUnreadForAgent(agent.agentId).catch(() => 0);
  return NextResponse.json({ ok: true, unread }, { headers: { "Cache-Control": "no-store" } });
}
