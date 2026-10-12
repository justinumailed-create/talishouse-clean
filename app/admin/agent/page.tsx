import Link from "next/link";
import { redirect } from "next/navigation";
import AgentDashboard from "@/components/admin/agents/AgentDashboard";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { getAgentById, listAgentMapSites } from "@/lib/agent-admins";
import { listManualPayments } from "@/lib/manual-payments";
import { countUnreadChat } from "@/lib/agent-collab-server";

export const dynamic = "force-dynamic";

export default async function AgentHomePage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect("/admin/login");

  if (account.access !== "agent" || !account.agentId) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        This is the Agent Admin dashboard. You are signed in as a built-in admin ({account.name}).
        {accountHasAdminScope(account, "agents") ? (
          <>
            {" "}
            Use{" "}
            <Link href="/admin/agents" className="text-[#1E4ED8] underline">
              Agents
            </Link>{" "}
            to manage agents or “View as agent”.
          </>
        ) : null}
      </div>
    );
  }

  const agent = await getAgentById(account.agentId);
  if (!agent || agent.status !== "active") redirect("/admin/login");
  const [mapsites, payments, chatUnread] = await Promise.all([
    listAgentMapSites(agent.assignedMapSites),
    agent.privileges.includes("cash-payments") && !agent.mustChangePassword
      ? listManualPayments({ agentId: agent.id, limit: 50 })
      : Promise.resolve([]),
    agent.mustChangePassword
      ? Promise.resolve(0)
      : countUnreadChat({ ...account, agentId: agent.id }).catch(() => 0),
  ]);
  return <AgentDashboard agent={agent} mapsites={mapsites} payments={payments} chatUnread={chatUnread} />;
}
