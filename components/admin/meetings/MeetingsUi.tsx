import Link from "next/link";
import { StatusPill, cardClass } from "@/components/admin/ui";
import {
  MEETING_BOTS,
  formatDuration,
  formatMeetingTime,
  humanize,
  type Meeting,
  type MeetingsResult,
} from "@/lib/tsplits-meetings";

/** Empty / error state when ElevenLabs can't be read. */
export function MeetingsNotice({ result }: { result: MeetingsResult }) {
  if (result.ok) return null;
  return (
    <div className={`${cardClass} p-6`}>
      <p className="text-sm font-semibold text-neutral-900">
        {result.reason === "missing-key" ? "ElevenLabs isn’t connected yet" : "Couldn’t load calls from ElevenLabs"}
      </p>
      <p className="mt-1 text-sm text-neutral-500">{result.message}</p>
    </div>
  );
}

export function BotPill({ bot }: { bot: Meeting["bot"] }) {
  return <StatusPill tone={bot === "aisha" ? "blue" : "amber"}>{MEETING_BOTS[bot].name}</StatusPill>;
}

export function ContactCell({ meeting }: { meeting: Meeting }) {
  if (meeting.validContact) {
    const href = meeting.validContact.kind === "email" ? `mailto:${meeting.validContact.value}` : `tel:${meeting.validContact.value.replace(/[^\d+]/g, "")}`;
    return (
      <a href={href} className="font-medium text-[#1E4ED8] hover:underline">
        {meeting.validContact.value}
      </a>
    );
  }
  if (meeting.contactRaw) {
    return <span className="text-neutral-400" title="Not a valid phone number or email">{meeting.contactRaw} (invalid)</span>;
  }
  return <span className="text-neutral-400">—</span>;
}

function outcomeTone(v: string | null): "green" | "red" | "neutral" {
  if (v === "success") return "green";
  if (v === "failure") return "red";
  return "neutral";
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const bot = MEETING_BOTS[meeting.bot];
  return (
    <article id={meeting.id} className={`${cardClass} scroll-mt-24 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">
            {formatMeetingTime(meeting.startUnix)} IST · {formatDuration(meeting.durationSecs)}
          </p>
          <h3 className="mt-0.5 text-[15px] font-semibold text-neutral-900">{meeting.title ?? "Call"}</h3>
        </div>
        {meeting.callSuccessful ? <StatusPill tone={outcomeTone(meeting.callSuccessful)}>{humanize(meeting.callSuccessful)}</StatusPill> : null}
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-neutral-500">Caller</dt>
          <dd className="mt-0.5 text-neutral-900">{meeting.callerName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Contact</dt>
          <dd className="mt-0.5 break-words">
            <ContactCell meeting={meeting} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Callback time</dt>
          <dd className="mt-0.5 text-neutral-900">{meeting.callbackTime ?? "—"}</dd>
        </div>
        {bot.fields
          .filter((f) => f.key !== "callback_phone")
          .map((f) => (
            <div key={f.key}>
              <dt className="text-xs font-medium text-neutral-500">{f.label}</dt>
              <dd className="mt-0.5 break-words text-neutral-900">{humanize(meeting.fields[f.key] ?? null)}</dd>
            </div>
          ))}
      </dl>

      {meeting.summary ? <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{meeting.summary}</p> : null}

      {meeting.transcript.length > 0 ? (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm font-semibold text-[#1E4ED8] hover:underline">
            Transcript ({meeting.transcript.length} messages)
          </summary>
          <ol className="mt-3 space-y-2">
            {meeting.transcript.map((t, i) => (
              <li key={i} className={`rounded-xl px-3 py-2 text-sm ${t.role === "agent" ? "bg-[#1E4ED8]/5 text-neutral-900" : "bg-neutral-100 text-neutral-900"}`}>
                <span className="mr-2 text-xs font-semibold text-neutral-500">{t.role === "agent" ? bot.name : "Caller"}</span>
                {t.message}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}

export function MeetingsPage({ bot, result }: { bot: Meeting["bot"]; result: MeetingsResult }) {
  if (!result.ok) return <MeetingsNotice result={result} />;
  if (result.meetings.length === 0) {
    return <p className={`${cardClass} p-6 text-sm text-neutral-500`}>No calls with {MEETING_BOTS[bot].name} yet.</p>;
  }
  return (
    <div className="space-y-4">
      {result.meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} />
      ))}
    </div>
  );
}

export function meetingHref(m: Meeting): string {
  return `${MEETING_BOTS[m.bot].href}#${m.id}`;
}

export function MeetingLink({ meeting }: { meeting: Meeting }) {
  return (
    <Link href={meetingHref(meeting)} className="text-sm font-semibold text-[#1E4ED8] hover:underline">
      Open call
    </Link>
  );
}
