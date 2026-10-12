import Link from "next/link";
import { redirect } from "next/navigation";
import AgentNotesClient from "@/components/admin/agents/AgentNotesClient";
import { PageHeader, cardClass } from "@/components/admin/agents/ui";
import { canEditNoteOn, istDate, isValidDateString } from "@/lib/agent-collab";
import {
  getCurrentAgent,
  listAgentNoteDates,
  listAgentNoteFiles,
  listAgentNotes,
} from "@/lib/agent-collab-server";

export const dynamic = "force-dynamic";

function prettyDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

export default async function AgentNotesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/admin/agent");
  const today = istDate();
  const requested = (await searchParams).date;
  const date = isValidDateString(requested) && requested <= today ? requested : today;

  const [notes, files, dates] = await Promise.all([
    listAgentNotes({ agentId: agent.agentId, from: date, to: date }),
    listAgentNoteFiles({ agentId: agent.agentId, from: date, to: date }),
    listAgentNoteDates(agent.agentId),
  ]);
  const history = [...new Set([today, ...dates])].sort().reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Daily notes"
        title={prettyDate(date)}
        subtitle={date === today ? "Log today’s tasks and attach documents. You can edit today’s notes until midnight IST." : "Past day — read-only."}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <AgentNotesClient
          editable={canEditNoteOn(date)}
          notes={notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt, updatedAt: n.updatedAt }))}
          files={files.map((f) => ({ id: f.id, fileName: f.fileName, sizeBytes: f.sizeBytes, createdAt: f.createdAt, url: f.url }))}
        />
        <aside className={`${cardClass} h-fit p-4`}>
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">History</h2>
          <ul className="mt-2 space-y-0.5">
            {history.map((d) => (
              <li key={d}>
                <Link
                  href={d === today ? "/admin/agent/notes" : `/admin/agent/notes?date=${d}`}
                  className={`block rounded-lg px-2 py-1.5 text-sm ${d === date ? "bg-[#1E4ED8]/10 font-semibold text-[#1E4ED8]" : "text-neutral-700 hover:bg-neutral-50"}`}
                >
                  {d === today ? "Today" : prettyDate(d)}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
