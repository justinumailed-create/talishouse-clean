import Link from "next/link";
import { redirect } from "next/navigation";
import AgentDashboard from "@/components/admin/agents/AgentDashboard";
import AgentContractCodeCard from "@/components/admin/agents/AgentContractCodeCard";
import { getAgentContractCode, listSignedContracts } from "@/lib/talispros/mapsite-contract-service";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { getAgentById, listAgentMapSites } from "@/lib/agent-admins";
import { listManualPayments } from "@/lib/manual-payments";
import { countUnreadForAgent } from "@/lib/chat/server";
import { agentLoginPath } from "@/lib/agent-return-path";

export const dynamic = "force-dynamic";

export default async function AgentHomePage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect(agentLoginPath("/admin/agent"));

  if (account.access !== "agent" || !account.agentId) {
    const canContracts = account.access === "global" || accountHasAdminScope(account, "mapsites");
    return (
      <div className="space-y-6">
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
      {canContracts ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Agent codes are permanent per agent. See every agent&apos;s code and the clients who signed with it in{" "}
          <Link href="/admin/contracts" className="text-[#1E4ED8] underline">
            Contracts
          </Link>
          .
        </div>
      ) : null}
      </div>
    );
  }

  const agent = await getAgentById(account.agentId);
  if (!agent || agent.status !== "active") redirect("/admin/login");
  const [mapsites, payments, chatUnread, contractCode, signedClients] = await Promise.all([
    listAgentMapSites(agent.assignedMapSites),
    agent.privileges.includes("cash-payments") && !agent.mustChangePassword
      ? listManualPayments({ agentId: agent.id, limit: 50 })
      : Promise.resolve([]),
    agent.mustChangePassword
      ? Promise.resolve(0)
      : countUnreadForAgent(agent.id).catch(() => 0),
    getAgentContractCode(agent.id),
    listSignedContracts({ agentId: agent.id, limit: 100 }),
  ]);
  return (
    <div className="space-y-6">
      <AgentDashboard agent={agent} mapsites={mapsites} payments={payments} chatUnread={chatUnread} />
      {agent.mustChangePassword ? null : (
        <AgentContractCodeCard
          code={contractCode}
          clients={signedClients.map((c) => ({
            id: c.id,
            fastCode: c.fastCode,
            signerName: c.signerName,
            signerBusiness: c.signerBusiness,
            signedAt: c.signedAt,
          }))}
        />
      )}
    </div>
  );
}
