import Link from "next/link";
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
      <div>
        <Link href="/admin/agents" className="text-sm text-[#1E4ED8] underline">← Agents</Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Cash payments</h1>
        <p className="mt-1 text-sm text-neutral-500">
          FAST Codes marked paid in cash (CAD). Reversing marks the payment reversed and restores the Mapsite’s previous status.
        </p>
      </div>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <CashPaymentsTable payments={payments} agentNames={agentNames} canReverse={account.access !== "agent"} />
      </section>
    </div>
  );
}
