import { PageHeader, cardClass } from "@/components/admin/ui";
import { BotPill, ContactCell, MeetingLink, MeetingsNotice } from "@/components/admin/meetings/MeetingsUi";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { fetchAllMeetings, followUpsFrom, formatMeetingTime, humanize } from "@/lib/tsplits-meetings";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  await requireAdminScopePage("dashboard");
  const { aisha, webster } = await fetchAllMeetings();
  const followUps = followUpsFrom([...aisha.meetings, ...webster.meetings]);
  const failed = [aisha, webster].find((r) => !r.ok);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Follow Ups"
        title="Follow Ups"
        subtitle="Callers who left a real phone number or email with Aisha or Webster, newest first (IST). Junk contacts are left out."
      />
      {failed ? <MeetingsNotice result={failed} /> : null}
      {failed && followUps.length === 0 ? null : followUps.length === 0 ? (
        <p className={`${cardClass} p-6 text-sm text-neutral-500`}>No follow ups yet. Calls show here once a caller leaves a valid phone number or email.</p>
      ) : (
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Callback time</th>
                <th className="px-4 py-3 font-semibold">Bot</th>
                <th className="px-4 py-3 font-semibold">Structure / interest</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 align-top">
              {followUps.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatMeetingTime(m.startUnix)}</td>
                  <td className="px-4 py-3 text-neutral-900">{m.callerName ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3"><ContactCell meeting={m} /></td>
                  <td className="px-4 py-3 text-neutral-700">{m.callbackTime ?? "—"}</td>
                  <td className="px-4 py-3"><BotPill bot={m.bot} /></td>
                  <td className="px-4 py-3 text-neutral-700">
                    {humanize(m.fields.structure_choice ?? m.fields.account_type_interest ?? null)}
                  </td>
                  <td className="max-w-md px-4 py-3 text-neutral-600">{m.summary ?? m.title ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3"><MeetingLink meeting={m} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
