import { LinkButton, PageHeader, cardClass } from "@/components/admin/ui";
import CashPaymentsTable from "@/components/admin/agents/CashPaymentsTable";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { listAgents } from "@/lib/agent-admins";
import { listManualPayments } from "@/lib/manual-payments";

export const dynamic = "force-dynamic";

/** Superadmin/full: every cash (manual) FAST Code payment, with reversal. */
export default async function AgentCashPaymentsPage() {
  const account = await requireAdminScopePage("agents");
  const [payments, agents] = await Promise.all([listManualPayments({ limit: 200 }), listAgents()]);
  const agentNames = Object.fromEntries(agents.agents.map((agent) => [agent.id, agent.name]));
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Agents"
        title="Cash payments"
        subtitle="FAST Codes marked paid in cash (CAD). Reversing marks the payment reversed and restores the Mapsite’s previous status."
        actions={<LinkButton href="/admin/agents">← All agents</LinkButton>}
      />
      <section className={`${cardClass} p-6`}>
        <CashPaymentsTable payments={payments} agentNames={agentNames} canReverse={account.access !== "agent"} />
      </section>
    </div>
  );
}
