import Link from "next/link";
import { cardClass } from "@/components/admin/ui";
import { fetchAllMeetings, followUpsFrom, meetingCounts, todosFrom } from "@/lib/tsplits-meetings";

function Tile({ href, label, value, hint }: { href: string; label: string; value: string | number; hint: string }) {
  return (
    <Link href={href} className={`${cardClass} block p-5 transition hover:border-[#1E4ED8]/40`}>
      <div className="text-[13px] font-medium text-neutral-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900">{value}</div>
      <div className="mt-1 text-xs text-neutral-500">{hint}</div>
    </Link>
  );
}

/** Compact top-of-dashboard summary of the Tsplits™ call flow (Aisha → Webster → follow ups). */
export default async function FlowSummary() {
  const { aisha, webster } = await fetchAllMeetings();
  const a = meetingCounts(aisha.meetings);
  const w = meetingCounts(webster.meetings);
  const all = [...aisha.meetings, ...webster.meetings];
  const followUps = followUpsFrom(all).length;
  const todos = todosFrom(all).length;
  const notConnected = !aisha.ok && aisha.reason === "missing-key";

  return (
    <section className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile href="/admin/meetings/aisha" label="Calls with Aisha" value={aisha.ok ? a.today : "—"} hint={aisha.ok ? `today · ${a.week} in last 7 days` : "Not available"} />
        <Tile href="/admin/meetings/webster" label="Calls with Webster" value={webster.ok ? w.today : "—"} hint={webster.ok ? `today · ${w.week} in last 7 days` : "Not available"} />
        <Tile href="/admin/follow-ups" label="Open follow ups" value={aisha.ok || webster.ok ? followUps : "—"} hint="Valid phone or email left" />
        <Tile href="/admin/todos" label="To-dos" value={aisha.ok || webster.ok ? todos : "—"} hint="Callbacks, negotiations, Agent Codes" />
      </div>
      {notConnected ? (
        <p className="text-xs text-neutral-500">The ElevenLabs connection isn’t set up yet, so call numbers are not shown.</p>
      ) : null}
    </section>
  );
}
