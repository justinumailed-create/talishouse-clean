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
import AishaTranscriptsList from "@/components/admin/agent/AishaTranscriptsList";
import { AISHA_TRANSCRIPTS_SCOPE } from "@/lib/aisha-transcript-routing";
import { listRoutedAishaTranscripts } from "@/lib/aisha-transcript-ingest";

export const dynamic = "force-dynamic";

export default async function AgentHomePage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect(agentLoginPath("/admin/agent"));

  if (account.access !== "agent" || !account.agentId) {
    const canContracts = account.access === "global" || accountHasAdminScope(account, "mapsites");
    return (
      <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        This is the Associate Admin dashboard. You are signed in as a built-in admin ({account.name}).
        {accountHasAdminScope(account, "agents") ? (
          <>
            {" "}
            Use{" "}
            <Link href="/admin/associates" className="text-[#1E4ED8] underline">
              Associates
            </Link>{" "}
            to manage associates or “View as associate”.
          </>
        ) : null}
      </div>
      {canContracts ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Associate codes are permanent per associate. See every associate&apos;s code and the clients who signed with it in{" "}
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
  const [mapsites, payments, chatUnread, contractCode, signedClients, routedTranscripts] = await Promise.all([
    listAgentMapSites(agent.assignedMapSites),
    agent.privileges.includes("cash-payments") && !agent.mustChangePassword
      ? listManualPayments({ agentId: agent.id, limit: 50 })
      : Promise.resolve([]),
    agent.mustChangePassword
      ? Promise.resolve(0)
      : countUnreadForAgent(agent.id).catch(() => 0),
    getAgentContractCode(agent.id),
    listSignedContracts({ agentId: agent.id, limit: 100 }),
    accountHasAdminScope(account, AISHA_TRANSCRIPTS_SCOPE) && !agent.mustChangePassword
      ? listRoutedAishaTranscripts({ assigneeId: agent.id, limit: 8 })
      : Promise.resolve([]),
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
      {accountHasAdminScope(account, AISHA_TRANSCRIPTS_SCOPE) && !agent.mustChangePassword ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">Aisha transcripts</h2>
            <Link href="/admin/agent/transcripts" className="text-sm font-semibold text-[#1E4ED8]">
              View all
            </Link>
          </div>
          <AishaTranscriptsList
            transcripts={routedTranscripts}
            emptyLabel="No new Aisha transcripts have been routed yet. Qualifying ended calls will appear here."
          />
        </section>
      ) : null}
    </div>
  );
}
