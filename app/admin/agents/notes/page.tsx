import Link from "next/link";
import AgentFilterBar from "@/components/admin/agents/AgentFilterBar";
import { PageHeader, cardClass } from "@/components/admin/agents/ui";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { formatBytes, formatIstTime, istDate, isValidDateString } from "@/lib/agent-collab";
import { listAgentNoteFiles, listAgentNotes } from "@/lib/agent-collab-server";
import { listAgents } from "@/lib/agent-admins";

export const dynamic = "force-dynamic";

export default async function AdminAgentNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; from?: string; to?: string }>;
}) {
  await requireAdminScopePage("agents");
  const sp = await searchParams;
  const { agents } = await listAgents();
  const agentId = agents.some((a) => a.id === sp.agent) ? sp.agent! : null;
  const today = istDate();
  const from = isValidDateString(sp.from) ? sp.from : sp.to ? null : today;
  const to = isValidDateString(sp.to) ? sp.to : null;
  const [notes, files] = await Promise.all([
    listAgentNotes({ agentId, from, to }),
    listAgentNoteFiles({ agentId, from, to }),
  ]);
  const byId = new Map(agents.map((a) => [a.id, a]));

  // Group by date, then agent.
  const groups = new Map<string, Map<string, { notes: typeof notes; files: typeof files }>>();
  const slot = (date: string, agent: string) => {
    if (!groups.has(date)) groups.set(date, new Map());
    const g = groups.get(date)!;
    if (!g.has(agent)) g.set(agent, { notes: [], files: [] });
    return g.get(agent)!;
  };
  for (const n of notes) slot(n.noteDate, n.agentId).notes.push(n);
  for (const f of files) slot(f.noteDate, f.agentId).files.push(f);
  const dates = [...groups.keys()].sort().reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Agents"
        title="Daily notes"
        subtitle="Task notes and documents agents posted, by day (IST). Defaults to today."
        actions={<Link href="/admin/agents" className="text-sm font-medium text-[#1E4ED8] hover:underline">← All agents</Link>}
      />
      <AgentFilterBar
        action="/admin/agents/notes"
        agents={agents.map((a) => ({ id: a.id, name: a.name, loginId: a.loginId }))}
        values={{ agent: agentId ?? "", from: from ?? "", to: to ?? "" }}
      />
      {dates.length === 0 ? (
        <p className={`${cardClass} p-6 text-sm text-neutral-500`}>No notes for these filters.</p>
      ) : (
        dates.map((date) => (
          <section key={date} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{date === today ? `Today · ${date}` : date}</h2>
            {[...groups.get(date)!.entries()].map(([agent, g]) => (
              <article key={agent} className={`${cardClass} p-5`}>
                <h3 className="text-[15px] font-semibold text-neutral-900">{byId.get(agent)?.name ?? "Unknown agent"}</h3>
                <ul className="mt-3 space-y-3">
                  {g.notes.map((n) => (
                    <li key={n.id} className="rounded-xl bg-neutral-50 px-4 py-3">
                      <p className="text-xs text-neutral-500">{formatIstTime(n.createdAt)} IST{n.updatedAt !== n.createdAt ? ` · edited ${formatIstTime(n.updatedAt)}` : ""}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-900">{n.body}</p>
                    </li>
                  ))}
                </ul>
                {g.files.length > 0 ? (
                  <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                    {g.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="min-w-0 truncate">{f.fileName} <span className="text-xs text-neutral-500">· {formatBytes(f.sizeBytes)}</span></span>
                        {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-[#1E4ED8] hover:underline">Open</a> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
