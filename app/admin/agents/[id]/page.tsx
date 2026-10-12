import Link from "next/link";
import { notFound } from "next/navigation";
import AgentForm from "@/components/admin/agents/AgentForm";
import AgentPageForm from "@/components/admin/agents/AgentPageForm";
import AgentPasswordPanel from "@/components/admin/agents/AgentPasswordPanel";
import AgentStatusButton from "@/components/admin/agents/AgentStatusButton";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { getAgentById, listAgentAudit } from "@/lib/agent-admins";
import { updateAgentPageAsManagerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminAgentEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminScopePage("agents");
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();
  const audit = await listAgentAudit(agent.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/agents" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← All agents
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{agent.name}</h1>
          <p className="text-sm text-neutral-500">
            <span className="font-mono">{agent.loginId}</span> · created {agent.createdAt.slice(0, 10)}
            {agent.createdBy ? ` by ${agent.createdBy}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/agents/${agent.id}/preview`}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            View as agent
          </Link>
          <AgentStatusButton id={agent.id} status={agent.status} />
        </div>
      </div>

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

      <AgentPageForm
        save={updateAgentPageAsManagerAction.bind(null, agent.id)}
        publicHref={`/associate/${encodeURIComponent(agent.loginId)}`}
        initial={{
          pageHeadline: agent.pageHeadline ?? "",
          pageSubtext: agent.pageSubtext ?? "",
          pageCta: agent.pageCta ?? "",
          pageBio: agent.pageBio ?? "",
          videoUrl: agent.videoUrl ?? "",
          showContactForm: agent.showContactForm,
        }}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
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
