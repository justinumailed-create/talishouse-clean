import Link from "next/link";
import AgentForm, { EMPTY_AGENT_FORM } from "@/components/admin/agents/AgentForm";
import AgentStatusButton from "@/components/admin/agents/AgentStatusButton";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { AGENT_SCOPE_LABELS } from "@/lib/admin-constants";
import { listAgents } from "@/lib/agent-admins";
import { LinkButton, PageHeader, PresenceDot, StatusPill, cardClass } from "@/components/admin/ui";
import { isAgentOnline, presenceLabel } from "@/lib/agent-collab";
import { getAgentPresence } from "@/lib/agent-collab-server";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  await requireAdminScopePage("agents");
  const { agents, error } = await listAgents();
  const presence = await getAgentPresence(agents.map((a) => a.id)).catch(() => new Map());

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Superadmin"
        title="Agents"
        subtitle="Agents sign in at /agent/login with their login ID and password and only see the privileges you grant."
        actions={
          <>
            <LinkButton href="/admin/agents/activity">Activity log</LinkButton>
            <LinkButton href="/admin/agents/notes">Daily notes</LinkButton>
            <LinkButton href="/admin/agents/payments">Cash payments</LinkButton>
            <LinkButton href="#create-agent" variant="primary">New agent</LinkButton>
          </>
        }
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Could not load agents: {error}</p>
      ) : null}

      <section className={`${cardClass} overflow-hidden`}>
        {agents.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No agents yet. Create the first one below.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Login ID</th>
                <th className="px-4 py-3">Privileges</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <PresenceDot online={isAgentOnline(presence.get(agent.id) ?? null)} />
                      <div>
                        <div className="font-medium text-neutral-900">{agent.name}</div>
                        <div className="text-xs text-neutral-500">{presenceLabel(presence.get(agent.id) ?? null)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{agent.loginId}{agent.hasPassword ? "" : " (no password)"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {agent.privileges.length === 0
                      ? "Dashboard only"
                      : agent.privileges.map((p) => AGENT_SCOPE_LABELS[p].split(" (")[0]).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={agent.status === "active" ? "green" : "red"}>{agent.status === "active" ? "Active" : "Disabled"}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                    <Link href={`/admin/agents/${agent.id}`} className="font-semibold text-[#1E4ED8] hover:underline">
                      Edit
                    </Link>
                    <Link href={`/admin/agents/${agent.id}/preview`} className="font-semibold text-[#1E4ED8] hover:underline">
                      View as agent
                    </Link>
                    <AgentStatusButton id={agent.id} status={agent.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section id="create-agent" className="scroll-mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Create agent</h2>
        <AgentForm initial={EMPTY_AGENT_FORM} />
      </section>
    </div>
  );
}
