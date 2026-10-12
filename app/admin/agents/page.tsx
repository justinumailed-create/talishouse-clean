import Link from "next/link";
import AgentForm, { EMPTY_AGENT_FORM } from "@/components/admin/agents/AgentForm";
import AgentStatusButton from "@/components/admin/agents/AgentStatusButton";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { AGENT_SCOPE_LABELS } from "@/lib/admin-constants";
import { listAgents } from "@/lib/agent-admins";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  await requireAdminScopePage("agents");
  const { agents, error } = await listAgents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Agents</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Agent Admins sign in at /agent/login with their login ID and password, and only see the privileges you grant.{" "}
          <Link href="/admin/agents/payments" className="text-[#1E4ED8] underline">
            Cash payments
          </Link>
          {" · "}
          <Link href="/admin/agents/activity" className="text-[#1E4ED8] underline">
            Activity log
          </Link>
          {" · "}
          <Link href="/admin/agents/notes" className="text-[#1E4ED8] underline">
            Daily notes
          </Link>
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Could not load agents: {error}</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {agents.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No agents yet. Create the first one below.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
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
                    <p className="font-medium text-neutral-900">{agent.name}</p>
                    <p className="text-xs text-neutral-500">{agent.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-mono">{agent.loginId}{agent.hasPassword ? "" : " (no password)"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {agent.privileges.length === 0
                      ? "Dashboard only"
                      : agent.privileges.map((p) => AGENT_SCOPE_LABELS[p].split(" (")[0]).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={agent.status === "active" ? "text-green-700" : "text-red-600"}>{agent.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                    <Link href={`/admin/agents/${agent.id}`} className="text-[#1E4ED8] underline">
                      Edit
                    </Link>
                    <Link href={`/admin/agents/${agent.id}/preview`} className="text-[#1E4ED8] underline">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Create agent</h2>
        <AgentForm initial={EMPTY_AGENT_FORM} />
      </section>
    </div>
  );
}
