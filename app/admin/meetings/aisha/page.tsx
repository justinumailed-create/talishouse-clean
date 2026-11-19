import { PageHeader } from "@/components/admin/ui";
import { MeetingsPage } from "@/components/admin/meetings/MeetingsUi";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { MEETING_BOTS, fetchBotMeetings } from "@/lib/tsplits-meetings";

export const dynamic = "force-dynamic";

export default async function MeetingsAishaPage() {
  await requireAdminScopePage("dashboard");
  const bot = MEETING_BOTS.aisha;
  const result = await fetchBotMeetings("aisha");
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Meetings"
        title={`Meetings by ${bot.name}`}
        subtitle={`${bot.role}. Latest calls from ElevenLabs, newest first (times in IST). Refreshes every minute.`}
      />
      <MeetingsPage bot="aisha" result={result} />
    </div>
  );
}
