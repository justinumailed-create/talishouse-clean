import { PageHeader, StatusPill, cardClass } from "@/components/admin/ui";
import { BotPill, MeetingLink, MeetingsNotice } from "@/components/admin/meetings/MeetingsUi";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { fetchAllMeetings, formatMeetingTime, todosFrom, type MeetingTodo } from "@/lib/tsplits-meetings";

export const dynamic = "force-dynamic";

const KIND: Record<MeetingTodo["kind"], { label: string; tone: "blue" | "amber" | "green" }> = {
  callback: { label: "Call back", tone: "blue" },
  negotiation: { label: "Negotiation", tone: "amber" },
  "agent-code": { label: "Agent Code", tone: "green" },
};

export default async function TodosPage() {
  await requireAdminScopePage("dashboard");
  const { aisha, webster } = await fetchAllMeetings();
  const todos = todosFrom([...aisha.meetings, ...webster.meetings]);
  const failed = [aisha, webster].find((r) => !r.ok);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="To-dos"
        title="To-dos"
        subtitle="Next steps from Aisha’s and Webster’s calls: callbacks, negotiation requests and Agent Codes. Newest first (IST)."
      />
      {failed ? <MeetingsNotice result={failed} /> : null}
      {failed && todos.length === 0 ? null : todos.length === 0 ? (
        <p className={`${cardClass} p-6 text-sm text-neutral-500`}>Nothing to do right now.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((t) => (
            <li key={t.id} className={`${cardClass} flex flex-wrap items-start justify-between gap-3 p-5`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={KIND[t.kind].tone}>{KIND[t.kind].label}</StatusPill>
                  <BotPill bot={t.meeting.bot} />
                  <span className="text-xs text-neutral-500">{formatMeetingTime(t.meeting.startUnix)} IST</span>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-neutral-900">{t.title}</p>
                {t.detail ? <p className="mt-0.5 text-sm text-neutral-500">{t.detail}</p> : null}
                {t.meeting.summary ? <p className="mt-2 text-sm text-neutral-600">{t.meeting.summary}</p> : null}
              </div>
              <MeetingLink meeting={t.meeting} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
