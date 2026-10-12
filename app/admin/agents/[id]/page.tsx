import { LinkButton, PageHeader } from "@/components/admin/ui";
import { notFound } from "next/navigation";
import AgentForm from "@/components/admin/agents/AgentForm";
import AgentPasswordPanel from "@/components/admin/agents/AgentPasswordPanel";
import AgentStatusButton from "@/components/admin/agents/AgentStatusButton";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { getAgentById, listAgentAudit } from "@/lib/agent-admins";

export const dynamic = "force-dynamic";

export default async function AdminAgentEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminScopePage("agents");
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();
  const audit = await listAgentAudit(agent.id);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Agent"
        title={agent.name}
        subtitle={
          <>
            <span className="font-mono">{agent.loginId}</span> · created {agent.createdAt.slice(0, 10)}
            {agent.createdBy ? ` by ${agent.createdBy}` : ""}
          </>
        }
        actions={
          <>
            <LinkButton href="/admin/agents">← All agents</LinkButton>
            <LinkButton href={`/admin/agents/activity?agent=${agent.id}`}>Activity</LinkButton>
            <LinkButton href={`/admin/agents/notes?agent=${agent.id}`}>Notes</LinkButton>
            <LinkButton href={`/admin/agents/${agent.id}/preview`}>View as agent</LinkButton>
            <AgentStatusButton id={agent.id} status={agent.status} />
          </>
        }
      />

      <AgentForm
        initial={{
          id: agent.id,
          name: agent.name,
          email: agent.email ?? "",
          phone: agent.phone ?? "",
          loginId: agent.loginId,
          status: agent.status,
          privileges: [...agent.privileges],
          assignedMapSites: agent.assignedMapSites.join("\n"),
          regions: agent.regions.join("\n"),
          notes: agent.notes ?? "",
        }}
      />

      <AgentPasswordPanel
        id={agent.id}
        hasPassword={agent.hasPassword}
        mustChangePassword={agent.mustChangePassword}
        isLocked={agent.isLocked}
        lastLoginAt={agent.lastLoginAt}
      />


      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <h2 className="text-lg font-semibold text-neutral-900">Audit log</h2>
        {audit.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No changes logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-neutral-50 px-3 py-2">
                <p className="text-neutral-900">
                  <span className="font-mono text-xs">{entry.action}</span> · {entry.performedBy || "unknown"} ·{" "}
                  <span className="text-neutral-500">{new Date(entry.createdAt).toLocaleString("en-US")}</span>
                </p>
                {entry.details ? (
                  <p className="mt-1 break-all text-xs text-neutral-500">
                    Changed: {Object.keys(entry.details).join(", ") || "—"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
