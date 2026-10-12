import Link from "next/link";
import { notFound } from "next/navigation";
import AgentDashboard from "@/components/admin/agents/AgentDashboard";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { getAgentById, listAgentMapSites } from "@/lib/agent-admins";
import { listManualPayments } from "@/lib/manual-payments";

export const dynamic = "force-dynamic";

/**
 * Superadmin "View as agent": renders the agent's dashboard read-only inside
 * the admin shell. Does not touch the agent's or the viewer's session.
 */
export default async function AdminAgentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminScopePage("agents");
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();
  const [mapsites, payments] = await Promise.all([
    listAgentMapSites(agent.assignedMapSites),
    agent.privileges.includes("cash-payments")
      ? listManualPayments({ agentId: agent.id, limit: 50 })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span>
          Viewing as <strong>{agent.name}</strong> ({agent.loginId}) — read-only preview. Forms are disabled.
        </span>
        <Link href={`/admin/agents/${agent.id}`} className="font-medium underline">
          Back to edit
        </Link>
      </div>
      <AgentDashboard agent={agent} mapsites={mapsites} payments={payments} readOnly />
    </div>
  );
}
