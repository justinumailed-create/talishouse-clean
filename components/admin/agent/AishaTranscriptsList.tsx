import Link from "next/link";
import type { RoutedAishaTranscript } from "@/lib/aisha-transcript-ingest";
import { formatDuration, formatMeetingTime } from "@/lib/tsplits-meetings";

export default function AishaTranscriptsList({
  transcripts,
  emptyLabel,
}: {
  transcripts: RoutedAishaTranscript[];
  emptyLabel: string;
}) {
  if (transcripts.length === 0) {
    return <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {transcripts.map((item) => (
        <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{item.callerName || "Unknown caller"}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {formatMeetingTime(item.startedAt ? Math.floor(new Date(item.startedAt).getTime() / 1000) : null)}
                {" · "}
                {formatDuration(item.durationSecs)}
                {item.isRegistered ? " · Registered" : " · Unregistered"}
              </p>
            </div>
            {item.leadId ? (
              <Link href={`/admin/agent/leads/${item.leadId}`} className="text-sm font-semibold text-[#1E4ED8]">
                Open CRM contact
              </Link>
            ) : null}
          </div>
          <dl className="mt-4 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
            {item.callerPhone ? <div><dt className="text-xs uppercase tracking-wide text-neutral-400">Phone</dt><dd>{item.callerPhone}</dd></div> : null}
            {item.callerEmail ? <div><dt className="text-xs uppercase tracking-wide text-neutral-400">Email</dt><dd>{item.callerEmail}</dd></div> : null}
            {item.market ? <div><dt className="text-xs uppercase tracking-wide text-neutral-400">Market</dt><dd>{item.market}</dd></div> : null}
            {item.fastCode ? <div><dt className="text-xs uppercase tracking-wide text-neutral-400">FAST Code</dt><dd className="uppercase">{item.fastCode}</dd></div> : null}
          </dl>
          {item.summary ? <p className="mt-3 text-sm text-neutral-700">{item.summary}</p> : item.title ? <p className="mt-3 text-sm text-neutral-700">{item.title}</p> : null}
          {item.transcript.length > 0 ? (
            <ol className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
              {item.transcript.map((turn, index) => (
                <li key={`${item.id}-${index}`} className="text-sm">
                  <span className="font-medium text-neutral-500">{turn.role === "user" ? "Caller" : "Aisha"}: </span>
                  <span className="text-neutral-800">{turn.message}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <p className="mt-3 text-xs text-neutral-400">Source: Aisha Call · {item.conversationId}</p>
        </article>
      ))}
    </div>
  );
}
