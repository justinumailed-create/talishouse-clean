import Link from "next/link";
import { cardClass } from "@/components/admin/ui";
import {
  FAST_CODE_EVENT_LABELS,
  FAST_CODE_STAGES,
  FAST_CODE_STAGE_LABELS,
  istDay,
  istDayEndUtc,
  isFastCodeStage,
  stageAsOf,
  type FastCodeUpdate,
} from "@/lib/talispros/fast-code-tracker";
import { listFastCodeUpdates, listJobRuns, listTrackerRows } from "@/lib/talispros/fast-code-tracker-server";
import { loadCheckpointRollup } from "@/lib/talispros/call-flow-server";
import { CHECKPOINT_LABEL } from "@/lib/talispros/call-flow-copy";
import { addProspectToQueueAction } from "@/app/admin/dashboard/fast-code-tracker-actions";
import FastCodeRunNowButton from "./FastCodeRunNowButton";
import DisqualifyBrokerageControl from "@/components/admin/agents/DisqualifyBrokerageControl";

type Locale = "en" | "de";

const COPY = {
  en: {
    kicker: "Daily FAST Codes",
    title: "FAST Codes tracker",
    subtitle: "Every prospect code, its agent and conversation stage. Pick a date to see the state on that day.",
    date: "Date",
    agent: "Agent",
    stage: "Stage",
    all: "All",
    apply: "Show",
    today: "Today",
    code: "FAST Code",
    brokerage: "Brokerage",
    lastUpdate: "Last update",
    changes: "Changes that day",
    none: "None",
    timeline: "Timeline",
    open: "Open",
    close: "Close timeline",
    noUpdates: "No updates on or before this date.",
    lastRun: "Last daily run",
    never: "Not run yet",
    runs: "Runs at 06:00 IST every day.",
    queue: "Add a researched brokerage",
    queueHint:
      "Approve leads in Leads to approve, above. Add a brokerage here when it is not in that list yet. The FAST Code uses the decision maker’s first and last name initials. Without a name, phone and email the lead cannot be approved.",
    pending: "Pending review",
    approved: "Approved",
    approve: "Approve",
    reject: "Reject",
    add: "Add researched brokerage",
    fBrokerage: "Brokerage name",
    fContact: "Contact name",
    fAddress: "Office address",
    fTown: "Town",
    fProvince: "Province",
    fWebsite: "Website",
    fSource: "Source link (https)",
    fNotes: "Research notes",
    submit: "Add to queue",
    queueEmpty: "Nothing waiting for review.",
    websiteListings: "MLS® numbers on website",
    googleSource: "Google source",
    toResearch: "Decision maker, position, cell, email: to research",
    codePending: "Code pending: decision maker name needed",
    fFirst: "Decision maker first name",
    fLast: "Decision maker last name",
    fPosition: "Position",
    fPhone: "Phone",
    fEmail: "Email",
    rank: "Rank",
    sourcingNone: "No Google search in this run.",
    sourcingDone: (m: string, a: number, d: number) => `Google search in ${m}: ${a} new brokerages added, ${d} already known.`,
    sourcingNoKey: "Google search could not run: no Google key on the server.",
    sourcingError: "Google refused the search:",
    asOf: "As of",
    listings: "Listings",
    checkpoint: "Checkpoint",
    comments: "Comments",
    scrollHint: "Scroll sideways to see every column.",
  },
  de: {
    kicker: "Tägliche FAST Codes",
    title: "FAST-Code-Übersicht",
    subtitle: "Jeder Interessenten-Code mit Agent und Gesprächsphase. Wählen Sie ein Datum, um den Stand an diesem Tag zu sehen.",
    date: "Datum",
    agent: "Agent",
    stage: "Phase",
    all: "Alle",
    apply: "Anzeigen",
    today: "Heute",
    code: "FAST Code",
    brokerage: "Maklerbüro",
    lastUpdate: "Letzte Aktualisierung",
    changes: "Änderungen an dem Tag",
    none: "Keine",
    timeline: "Verlauf",
    open: "Öffnen",
    close: "Verlauf schließen",
    noUpdates: "Keine Aktualisierungen bis zu diesem Datum.",
    lastRun: "Letzter Tageslauf",
    never: "Noch nicht gelaufen",
    runs: "Läuft täglich um 06:00 IST.",
    queue: "Recherchiertes Maklerbüro hinzufügen",
    queueHint:
      "Leads werden oben unter Leads zur Freigabe freigegeben. Hier ein Maklerbüro hinzufügen, wenn es dort noch fehlt. Der FAST Code entsteht aus den Initialen von Vor- und Nachname. Ohne Name, Telefon und E-Mail ist keine Freigabe möglich.",
    pending: "Zur Prüfung",
    approved: "Freigegeben",
    approve: "Freigeben",
    reject: "Ablehnen",
    add: "Recherchiertes Maklerbüro hinzufügen",
    fBrokerage: "Name des Maklerbüros",
    fContact: "Ansprechpartner",
    fAddress: "Büroadresse",
    fTown: "Ort",
    fProvince: "Provinz",
    fWebsite: "Website",
    fSource: "Quellenlink (https)",
    fNotes: "Recherche-Notizen",
    submit: "Zur Liste hinzufügen",
    queueEmpty: "Nichts wartet auf Prüfung.",
    websiteListings: "MLS®-Nummern auf der Website",
    googleSource: "Google-Quelle",
    toResearch: "Entscheider, Position, Mobil, E-Mail: noch zu recherchieren",
    codePending: "Code ausstehend: Name des Entscheiders fehlt",
    fFirst: "Vorname des Entscheiders",
    fLast: "Nachname des Entscheiders",
    fPosition: "Position",
    fPhone: "Telefon",
    fEmail: "E-Mail",
    rank: "Rang",
    sourcingNone: "Keine Google-Suche in diesem Lauf.",
    sourcingDone: (m: string, a: number, d: number) => `Google-Suche in ${m}: ${a} neue Maklerbüros hinzugefügt, ${d} bereits bekannt.`,
    sourcingNoKey: "Google-Suche nicht möglich: kein Google-Schlüssel auf dem Server.",
    sourcingError: "Google hat die Suche abgelehnt:",
    asOf: "Stand",
    listings: "Inserate",
    checkpoint: "Prüfpunkt",
    comments: "Kommentare",
    scrollHint: "Seitwärts scrollen, um jede Spalte zu sehen.",
  },
} as const;

function fmt(iso: string, locale: Locale): string {
  return (
    new Date(iso).toLocaleString(locale === "de" ? "de-DE" : "en-CA", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " IST"
  );
}

function describe(u: FastCodeUpdate, locale: Locale): string {
  const ev = FAST_CODE_EVENT_LABELS[locale][u.eventType];
  if (u.eventType === "stage" && u.stage) {
    const from = isFastCodeStage(u.details.from) ? FAST_CODE_STAGE_LABELS[locale][u.details.from] : null;
    return `${ev}: ${from ? `${from} → ` : ""}${FAST_CODE_STAGE_LABELS[locale][u.stage]}`;
  }
  if (u.eventType === "refresh") {
    const parts: string[] = [];
    if (typeof u.details.listings === "number") parts.push(`${COPY[locale].listings}: ${u.details.listings}`);
    if (typeof u.details.brokerSite === "number") parts.push(`Website: ${u.details.brokerSite || "—"}`);
    if (typeof u.details.websiteListings === "number")
      parts.push(`${COPY[locale].websiteListings}: ${u.details.websiteListings}`);
    return `${ev}${parts.length ? ` · ${parts.join(" · ")}` : ""}`;
  }
  return u.note ? `${ev}: ${u.note}` : ev;
}

export default async function FastCodesTracker({
  locale,
  params,
  preserve = {},
}: {
  locale: Locale;
  params: { day?: string; agent?: string; stage?: string; code?: string };
  preserve?: Record<string, string>;
}) {
  const t = COPY[locale];
  const today = istDay(new Date());
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) && params.day <= today ? params.day : today;
  const end = istDayEndUtc(day);
  const start = new Date(Date.parse(end) - 24 * 60 * 60 * 1000).toISOString();
  const [rows, updates, runs, rollup] = await Promise.all([
    listTrackerRows(),
    listFastCodeUpdates({ beforeIso: end, limit: 5000 }),
    listJobRuns(1),
    loadCheckpointRollup(),
  ]);
  const byCode = new Map<string, FastCodeUpdate[]>();
  for (const u of updates) {
    const list = byCode.get(u.fastCode) ?? [];
    list.push(u);
    byCode.set(u.fastCode, list);
  }
  const agents = [...new Map(rows.filter((r) => r.agentId).map((r) => [r.agentId!, r.agentName ?? ""])).entries()];
  const view = rows
    .map((r) => {
      const list = byCode.get(r.fastCode.toLowerCase()) ?? [];
      const hit = rollup.get(r.fastCode.toLowerCase());
      return {
        ...r,
        stageThen: stageAsOf(list, end),
        last: list[0] ?? null,
        dayChanges: list.filter((u) => u.createdAt >= start),
        list,
        checkpointLabel: hit?.checkpoint ? CHECKPOINT_LABEL[locale][hit.checkpoint] : "—",
        commentCount: hit?.comments ?? 0,
      };
    })
    .filter((r) => !params.agent || r.agentId === params.agent)
    .filter((r) => !params.stage || r.stageThen === params.stage);
  const timelineCode = params.code?.toLowerCase() || null;
  const timeline = timelineCode ? view.find((r) => r.fastCode.toLowerCase() === timelineCode) ?? null : null;
  const lastRun = runs[0] ?? null;
  const sourcing = (lastRun?.summary as { sourcing?: { markets?: { market: string }[]; added?: number; duplicates?: number; errors?: string[]; keyEnv?: string | null } } | undefined)?.sourcing;
  const sourcingText = !sourcing
    ? t.sourcingNone
    : !sourcing.keyEnv
      ? t.sourcingNoKey
      : sourcing.errors?.length && !sourcing.added
        ? `${t.sourcingError} ${sourcing.errors[0]!.replace(/^[^:]+: /, "")}`
        : t.sourcingDone((sourcing.markets ?? []).map((m) => m.market).join("; "), sourcing.added ?? 0, sourcing.duplicates ?? 0);
  const href = (extra: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const merged = { day, agent: params.agent ?? null, stage: params.stage ?? null, code: params.code ?? null, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "day" && v === today)) q.set(k, v);
    const s = q.toString();
    return `/admin/dashboard${s ? `?${s}` : ""}#fast-codes-tracker`;
  };
  const input = "h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm text-neutral-900";

  return (
    <section id="fast-codes-tracker" className={`${cardClass} p-5 sm:p-6`} data-testid="fast-codes-tracker">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{t.kicker}</p>
          <h2 className="text-lg font-semibold text-neutral-900">{t.title}</h2>
          <p className="text-sm text-neutral-500">{t.subtitle}</p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>
            {t.lastRun}: {lastRun ? fmt(lastRun.finishedAt ?? lastRun.startedAt, locale) : t.never}
          </p>
          <p>{t.runs}</p>
          {lastRun ? <p className="max-w-xs" data-testid="sourcing-summary">{sourcingText}</p> : null}
          <div className="mt-2">
            <FastCodeRunNowButton locale={locale} />
          </div>
        </div>
      </div>

      <form method="get" action="/admin/dashboard" className="mt-4 flex flex-wrap items-end gap-3" data-testid="fast-codes-filters">
        {Object.entries(preserve).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.date}
          <input type="date" name="day" defaultValue={day} max={today} className={input} data-testid="fast-codes-date" />
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.agent}
          <select name="agent" defaultValue={params.agent ?? ""} className={input}>
            <option value="">{t.all}</option>
            {agents.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.stage}
          <select name="stage" defaultValue={params.stage ?? ""} className={input}>
            <option value="">{t.all}</option>
            {FAST_CODE_STAGES.map((s) => (
              <option key={s} value={s}>
                {FAST_CODE_STAGE_LABELS[locale][s]}
              </option>
            ))}
          </select>
        </label>
        {params.code ? <input type="hidden" name="code" value={params.code} /> : null}
        <button type="submit" className="h-9 rounded-lg bg-[#1E4ED8] px-4 text-sm font-semibold text-white">
          {t.apply}
        </button>
        {day !== today ? (
          <Link href={href({ day: today })} className="h-9 rounded-lg border border-neutral-300 px-3 text-sm leading-9 text-neutral-700">
            {t.today}
          </Link>
        ) : null}
        <span className="ml-auto text-xs text-neutral-500">
          {t.asOf} {day}
        </span>
      </form>

      <div className="mt-4 space-y-3 md:hidden" data-testid="fast-codes-cards">
        {view.map((r) => (
          <article key={r.fastCode} className="rounded-xl border border-neutral-200 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-[#1E4ED8]">{r.fastCode}</p>
                <Link href={`/admin/agent/flow/${r.fastCode.toLowerCase()}`} className="font-semibold text-neutral-900">
                  {r.brokerage}
                </Link>
                <p className="text-xs text-neutral-500">{r.agentName ?? "—"}</p>
              </div>
              <span className="rounded-full bg-[#1E4ED8]/10 px-2 py-0.5 text-xs font-semibold text-[#1E4ED8]">
                {FAST_CODE_STAGE_LABELS[locale][r.stageThen]}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-neutral-500">{t.checkpoint}</dt>
                <dd className="text-neutral-800" data-testid="fast-code-checkpoint">{r.checkpointLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-neutral-500">{t.comments}</dt>
                <dd className="text-neutral-800" data-testid="fast-code-comments">{r.commentCount}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold uppercase tracking-wide text-neutral-500">{t.lastUpdate}</dt>
                <dd className="text-neutral-700">{r.last ? fmt(r.last.createdAt, locale) : "—"}</dd>
              </div>
            </dl>
            <Link
              href={href({ code: timelineCode === r.fastCode.toLowerCase() ? null : r.fastCode.toLowerCase() })}
              className="mt-3 inline-flex text-xs font-semibold text-[#1E4ED8] underline"
            >
              {timelineCode === r.fastCode.toLowerCase() ? t.close : t.timeline}
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-4 hidden max-w-full overflow-x-auto md:block" data-testid="fast-codes-scroll">
        <p className="mb-2 text-xs text-neutral-500 lg:hidden">{t.scrollHint}</p>
        <table className="w-full min-w-[860px] text-left text-sm" data-testid="fast-codes-table">
          <thead className="text-xs uppercase tracking-wider text-neutral-500">
            <tr className="border-b border-neutral-200">
              <th className="py-2 pr-3">{t.code}</th>
              <th className="py-2 pr-3">{t.brokerage}</th>
              <th className="py-2 pr-3">{t.agent}</th>
              <th className="py-2 pr-3">{t.stage}</th>
              <th className="py-2 pr-3">{t.checkpoint}</th>
              <th className="py-2 pr-3">{t.comments}</th>
              <th className="py-2 pr-3">{t.lastUpdate}</th>
              <th className="py-2 pr-3">{t.changes}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.fastCode} className="border-b border-neutral-100 align-top">
                <td className="py-2 pr-3 font-mono font-semibold text-neutral-900">
                  <a href={r.mapsiteHref} target="_blank" rel="noreferrer" className="hover:text-[#1E4ED8]">
                    {r.fastCode}
                  </a>
                </td>
                <td className="py-2 pr-3 text-neutral-800">
                  <Link href={`/admin/agent/flow/${r.fastCode.toLowerCase()}`} className="hover:text-[#1E4ED8] hover:underline">
                    {r.brokerage}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-neutral-700">{r.agentName ?? "—"}</td>
                <td className="py-2 pr-3">
                  <span className="rounded-full bg-[#1E4ED8]/10 px-2 py-0.5 text-xs font-semibold text-[#1E4ED8]">
                    {FAST_CODE_STAGE_LABELS[locale][r.stageThen]}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs text-neutral-700" data-testid="fast-code-checkpoint">
                  {r.checkpointLabel}
                </td>
                <td className="py-2 pr-3 text-xs text-neutral-700" data-testid="fast-code-comments">
                  {r.commentCount}
                </td>
                <td className="py-2 pr-3 text-xs text-neutral-600">{r.last ? fmt(r.last.createdAt, locale) : "—"}</td>
                <td className="py-2 pr-3 text-xs text-neutral-700">
                  {r.dayChanges.length ? (
                    <ul className="m-0 list-none space-y-0.5 p-0">
                      {r.dayChanges.slice(0, 3).map((u) => (
                        <li key={u.id}>{describe(u, locale)}</li>
                      ))}
                      {r.dayChanges.length > 3 ? <li>+{r.dayChanges.length - 3}</li> : null}
                    </ul>
                  ) : (
                    <span className="text-neutral-400">{t.none}</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={href({ code: timelineCode === r.fastCode.toLowerCase() ? null : r.fastCode.toLowerCase() })}
                    className="text-xs font-semibold text-[#1E4ED8] underline"
                    data-testid="fast-codes-timeline-link"
                  >
                    {timelineCode === r.fastCode.toLowerCase() ? t.close : t.timeline}
                  </Link>
                  <DisqualifyBrokerageControl locale={locale} fastCode={r.fastCode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {timeline ? (
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" data-testid="fast-codes-timeline">
          <h3 className="text-[15px] font-semibold text-neutral-900">
            {t.timeline}: <span className="font-mono">{timeline.fastCode}</span> · {timeline.brokerage}
          </h3>
          {timeline.list.length ? (
            <ol className="m-0 mt-3 list-none space-y-3 border-l-2 border-[#1E4ED8]/30 p-0 pl-4">
              {timeline.list.map((u) => (
                <li key={u.id} className="text-sm">
                  <p className="m-0 text-xs text-neutral-500">
                    {fmt(u.createdAt, locale)}
                    {u.createdBy ? ` · ${u.createdBy === "daily-job" ? FAST_CODE_EVENT_LABELS[locale].refresh : u.createdBy.split(" (")[0]}` : ""}
                  </p>
                  <p className="m-0 text-neutral-800">{describe(u, locale)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">{t.noUpdates}</p>
          )}
        </div>
      ) : null}

      <details className="mt-5 rounded-xl border border-neutral-200 p-4" data-testid="prospect-queue">
        <summary className="cursor-pointer text-[15px] font-semibold text-neutral-900">{t.queue}</summary>
        <p className="mt-2 text-sm text-neutral-500">{t.queueHint}</p>
        <form action={addProspectToQueueAction} className="mt-4 grid gap-2 sm:grid-cols-2">
          <p className="m-0 text-sm font-semibold text-neutral-800 sm:col-span-2">{t.add}</p>
          <input name="brokerage" required placeholder={t.fBrokerage} className={input} />
          <input name="contact_first_name" placeholder={t.fFirst} className={input} />
          <input name="contact_last_name" placeholder={t.fLast} className={input} />
          <input name="contact_position" placeholder={t.fPosition} className={input} />
          <input name="contact_phone" placeholder={t.fPhone} className={input} />
          <input name="contact_email" placeholder={t.fEmail} className={input} />
          <input name="office_address" placeholder={t.fAddress} className={input} />
          <input name="town" placeholder={t.fTown} className={input} />
          <input name="province" placeholder={t.fProvince} className={input} />
          <input name="website" placeholder={t.fWebsite} className={input} />
          <input name="source_url" required type="url" pattern="https://.*" placeholder={t.fSource} className={`${input} sm:col-span-2`} />
          <textarea name="research_notes" rows={2} placeholder={t.fNotes} className="rounded-lg border border-neutral-300 px-2 py-1 text-sm sm:col-span-2" />
          <button type="submit" className="h-9 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white sm:w-fit">
            {t.submit}
          </button>
        </form>
      </details>
    </section>
  );
}
