import Link from "next/link";
import AgentFilterBar from "@/components/admin/agents/AgentFilterBar";
import { PageHeader, PresenceDot, cardClass } from "@/components/admin/agents/ui";
import { requireAdminScopePage } from "@/lib/admin-auth";
import {
  AGENT_ACTIVITY_LABELS,
  activityLabel,
  formatIst,
  isAgentOnline,
  isValidDateString,
  presenceLabel,
  redactActivityDetails,
} from "@/lib/agent-collab";
import { getAgentPresence, listAgentActivity, sweepExpiredAgentSessions } from "@/lib/agent-collab-server";
import { listAgents } from "@/lib/agent-admins";

export const dynamic = "force-dynamic";

function detailSummary(details: Record<string, unknown>): string {
  const d = redactActivityDetails(details);
  const parts: string[] = [];
  if (typeof d.fast_code === "string") parts.push(d.fast_code.toUpperCase());
  if (typeof d.amount_cad === "number") parts.push(`CA$${d.amount_cad.toFixed(2)}`);
  if (typeof d.count === "number") parts.push(`${d.count} PINs`);
  if (typeof d.note_date === "string") parts.push(`note ${d.note_date}`);
  if (typeof d.file_name === "string") parts.push(d.file_name);
  if (typeof d.brokerage_name === "string") parts.push(d.brokerage_name);
  if (typeof d.decision_maker_name === "string") parts.push(d.decision_maker_name);
  if (typeof d.country === "string") parts.push(d.country);
  if (typeof d.status === "string") parts.push(d.status);
  if (typeof d.owner_name === "string") parts.push(d.owner_name);
  if (typeof d.imported === "number") parts.push(`${d.imported} leads`);
  if (typeof d.signed_in_at === "string") parts.push(`session from ${formatIst(d.signed_in_at)}`);
  if (typeof d.last_activity_at === "string") parts.push(`last activity ${formatIst(d.last_activity_at)}`);
  if (typeof d.attempts === "number") parts.push(`${d.attempts} attempts`);
  return parts.join(" · ");
}

export default async function AgentActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; type?: string; from?: string; to?: string }>;
}) {
  await requireAdminScopePage("agents");
  const sp = await searchParams;
  await sweepExpiredAgentSessions();
  const { agents } = await listAgents();
  const agentId = agents.some((a) => a.id === sp.agent) ? sp.agent! : null;
  const type = sp.type && sp.type in AGENT_ACTIVITY_LABELS ? sp.type : null;
  const from = isValidDateString(sp.from) ? sp.from : null;
  const to = isValidDateString(sp.to) ? sp.to : null;
  const [entries, presence] = await Promise.all([
    listAgentActivity({ agentId, action: type, from, to }),
    getAgentPresence(agents.map((a) => a.id)),
  ]);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Agents"
        title="Activity log"
        subtitle="Sign-ins, sign-outs, session expiries and agent work. Times in IST. Chat messages are private and never logged."
        actions={<Link href="/admin/agents" className="text-sm font-medium text-[#1E4ED8] hover:underline">← All agents</Link>}
      />

      <section className={`${cardClass} p-4`}>
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">Who’s online</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {agents.map((a) => {
            const p = presence.get(a.id) ?? null;
            const online = isAgentOnline(p, now.getTime());
            return (
              <li key={a.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                <PresenceDot online={online} />
                <span className="font-medium text-neutral-900">{a.name}</span>
                <span className={online ? "text-green-700" : "text-neutral-500"}>{presenceLabel(p, now)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <AgentFilterBar
        action="/admin/agents/activity"
        agents={agents.map((a) => ({ id: a.id, name: a.name, loginId: a.loginId }))}
        values={{ agent: agentId ?? "", type: type ?? "", from: from ?? "", to: to ?? "" }}
        actionOptions={Object.entries(AGENT_ACTIVITY_LABELS).map(([value, label]) => ({ value, label }))}
      />

      <section className={`${cardClass} overflow-x-auto`}>
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No activity for these filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Time (IST)</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {entries.map((e) => {
                const a = e.agentId ? byId.get(e.agentId) : null;
                return (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{formatIst(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      {a ? (
                        <Link href={`/admin/agents/${a.id}`} className="font-medium text-neutral-900 hover:underline">{a.name}</Link>
                      ) : <span className="font-medium text-neutral-900">{e.performedBy || "—"}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800">{activityLabel(e.action)}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{detailSummary(e.details) || <span className="text-neutral-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
