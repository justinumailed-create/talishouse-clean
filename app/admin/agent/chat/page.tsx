import { redirect } from "next/navigation";
import AgentChat from "@/components/admin/agents/AgentChat";
import { PageHeader } from "@/components/admin/agents/ui";
import { getCurrentAgent } from "@/lib/agent-collab-server";

export const dynamic = "force-dynamic";

export default async function AgentChatPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/admin/agent");
  const initialPeer = (await searchParams).with ?? null;
  return (
    <div className="space-y-6">
      <PageHeader kicker="Messages" title="Agent chat" subtitle="Private 1:1 messages between agents. Only you and the other agent can read them." />
      <AgentChat initialPeer={initialPeer} />
    </div>
  );
}
