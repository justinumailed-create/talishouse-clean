"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewProspectAction, updateProspectContactAction } from "@/app/admin/dashboard/fast-code-tracker-actions";
import DisqualifyBrokerageControl from "@/components/admin/agents/DisqualifyBrokerageControl";
import { cardClass } from "@/components/admin/ui";
import { ProspectCsvImport } from "@/components/admin/ProspectQueueControls";
import { istDay } from "@/lib/talispros/fast-code-tracker";
import {
  contactGaps,
  decisionMakerLabel,
  leadStatusKey,
  type ApprovalLead,
  type ContactGap,
  type LeadFilter,
  type ProspectCountry,
} from "@/lib/talispros/prospect-approval";

type Locale = "en" | "de";

const COPY = {
  en: {
    kicker: "Approval",
    title: "Leads to approve",
    subtitle: "Canada and the United States are separate. A lead needs a name, phone and email before it can be approved.",
    canada: "Canada",
    usa: "United States",
    pending: (n: number) => `${n} pending`,
    brokerage: "Brokerage",
    townCa: "Town / province",
    townUs: "Town / state",
    person: "Decision maker",
    phone: "Phone",
    email: "Email",
    code: "FAST Code",
    status: "Status",
    added: "Date added",
    complete: "Contact",
    completeYes: "Complete",
    missing: "Missing",
    first: "First name",
    last: "Last name",
    save: "Save",
    saving: "Saving…",
    codePending: "Code pending",
    filters: "Filters",
    statusLabel: "Status",
    from: "Added from",
    to: "Added to",
    contact: "Contact",
    allContacts: "Complete or incomplete",
    onlyComplete: "Complete",
    onlyIncomplete: "Incomplete",
    apply: "Show",
    clear: "Clear filters",
    empty: "No leads match these filters.",
    page: (n: number, m: number, total: number) => `Page ${n} of ${m} · ${total} leads`,
    prev: "Previous",
    next: "Next",
    selectAll: "Select rows on this page",
    selectRow: "Select lead",
    approveSelected: "Approve selected",
    rejectSelected: "Reject selected",
    approveComplete: "Approve all complete in view",
    selected: (n: number) => `${n} selected`,
    noneSelected: "Select rows to approve or reject them together.",
    saved: "Contact saved.",
    failed: "Could not save. Please try again.",
    holdFailed: "Hold could not be saved.",
    updated: (n: number, decision: string) => `${decision}: ${n}.`,
    skipped: "Left unchanged",
    closed: "already decided",
    runBanner: "Showing leads from this sourcing run.",
    clearRun: "Show the full list",
    statuses: {
      pending: "Pending",
      code_pending: "Code pending",
      needs_review: "Needs review",
      approved: "Approved",
      rejected: "Rejected",
      on_hold: "On hold",
    } satisfies Record<LeadFilter, string>,
    gaps: { name: "name", phone: "phone", email: "email" } satisfies Record<ContactGap, string>,
  },
  de: {
    kicker: "Freigabe",
    title: "Leads zur Freigabe",
    subtitle: "Kanada und die USA sind getrennt. Ein Lead braucht Name, Telefon und E-Mail, bevor er freigegeben werden kann.",
    canada: "Kanada",
    usa: "USA",
    pending: (n: number) => `${n} offen`,
    brokerage: "Maklerbüro",
    townCa: "Ort / Provinz",
    townUs: "Ort / Bundesstaat",
    person: "Entscheider",
    phone: "Telefon",
    email: "E-Mail",
    code: "FAST Code",
    status: "Status",
    added: "Hinzugefügt",
    complete: "Kontakt",
    completeYes: "Vollständig",
    missing: "Fehlt",
    first: "Vorname",
    last: "Nachname",
    save: "Speichern",
    saving: "Speichert …",
    codePending: "Code ausstehend",
    filters: "Filter",
    statusLabel: "Status",
    from: "Hinzugefügt von",
    to: "Hinzugefügt bis",
    contact: "Kontakt",
    allContacts: "Vollständig oder unvollständig",
    onlyComplete: "Vollständig",
    onlyIncomplete: "Unvollständig",
    apply: "Anzeigen",
    clear: "Filter löschen",
    empty: "Keine Leads passen zu diesen Filtern.",
    page: (n: number, m: number, total: number) => `Seite ${n} von ${m} · ${total} Leads`,
    prev: "Zurück",
    next: "Weiter",
    selectAll: "Zeilen auf dieser Seite auswählen",
    selectRow: "Lead auswählen",
    approveSelected: "Auswahl freigeben",
    rejectSelected: "Auswahl ablehnen",
    approveComplete: "Alle vollständigen in der Ansicht freigeben",
    selected: (n: number) => `${n} ausgewählt`,
    noneSelected: "Zeilen auswählen, um sie gemeinsam freizugeben oder abzulehnen.",
    saved: "Kontakt gespeichert.",
    failed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    holdFailed: "Zurückstellen konnte nicht gespeichert werden.",
    updated: (n: number, decision: string) => `${decision}: ${n}.`,
    skipped: "Unverändert gelassen",
    closed: "bereits entschieden",
    runBanner: "Leads aus diesem Recherche-Lauf.",
    clearRun: "Gesamte Liste zeigen",
    statuses: {
      pending: "Offen",
      code_pending: "Code ausstehend",
      needs_review: "Bitte prüfen",
      approved: "Freigegeben",
      rejected: "Abgelehnt",
      on_hold: "Zurückgestellt",
    } satisfies Record<LeadFilter, string>,
    gaps: { name: "Name", phone: "Telefon", email: "E-Mail" } satisfies Record<ContactGap, string>,
  },
} as const;

const FILTERS: LeadFilter[] = ["pending", "code_pending", "needs_review", "approved", "rejected", "on_hold"];

export type LeadQuery = {
  country: ProspectCountry;
  status: LeadFilter;
  from: string;
  to: string;
  complete: "" | "complete" | "incomplete";
  page: number;
  run: string;
  added: string;
};

function hrefFor(query: LeadQuery, extra: Partial<LeadQuery>, preserve: Record<string, string>): string {
  const next = { ...query, ...extra };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(preserve)) if (value) params.set(key, value);
  if (next.country !== "CA") params.set("leadCountry", next.country);
  if (next.status !== "pending") params.set("leadStatus", next.status);
  if (next.from) params.set("leadFrom", next.from);
  if (next.to) params.set("leadTo", next.to);
  if (next.complete) params.set("leadComplete", next.complete);
  if (next.page > 1) params.set("leadPage", String(next.page));
  if (next.run) params.set("leadRun", next.run);
  if (next.added) params.set("leadAdded", next.added);
  const s = params.toString();
  return `/admin/dashboard${s ? `?${s}` : ""}#leads-to-approve`;
}

function gapText(locale: Locale, gaps: ContactGap[]): string {
  const t = COPY[locale];
  return gaps.map((gap) => t.gaps[gap]).join(", ");
}

const input = "h-8 w-full min-w-0 rounded-md border border-neutral-300 bg-white px-1.5 text-xs text-neutral-900";

export default function LeadsToApprove({
  locale,
  rows,
  pendingCa,
  pendingUs,
  total,
  pageCount,
  query,
  preserve,
  needsReviewIds,
  runApplied,
  initialSelected = [],
  preview = false,
}: {
  locale: Locale;
  rows: ApprovalLead[];
  pendingCa: number;
  pendingUs: number;
  total: number;
  pageCount: number;
  query: LeadQuery;
  preserve: Record<string, string>;
  needsReviewIds: string[];
  runApplied: boolean;
  initialSelected?: string[];
  preview?: boolean;
}) {
  const t = COPY[locale];
  const router = useRouter();
  const flagged = useMemo(() => new Set(needsReviewIds), [needsReviewIds]);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const openIds = rows.filter((row) => row.status === "pending" || row.status === "on_hold").map((row) => row.id);
  const allChecked = openIds.length > 0 && openIds.every((id) => selected.includes(id));
  const completeIds = rows
    .filter((row) => (row.status === "pending" || row.status === "on_hold") && contactGaps(row).length === 0)
    .map((row) => row.id);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function decide(decision: "approved" | "rejected" | "on_hold", ids: string[]) {
    if (!ids.length || preview) return;
    const fd = new FormData();
    for (const id of ids) fd.append("id", id);
    fd.set("decision", decision);
    start(async () => {
      setMsg(null);
      const res = await reviewProspectAction(fd);
      if (!res.ok) {
        setMsg(res.error === "hold" ? t.holdFailed : t.failed);
        return;
      }
      const label = decision === "approved" ? t.statuses.approved : decision === "rejected" ? t.statuses.rejected : t.statuses.on_hold;
      const bits = [t.updated(res.updated, label)];
      if (res.blocked.length) {
        const why = res.blocked
          .map((row) => `${row.brokerage}: ${row.reason === "closed" ? t.closed : gapText(locale, row.missing)}`)
          .join(" · ");
        bits.push(`${t.skipped} — ${why}`);
      }
      setMsg(bits.join(" "));
      setSelected([]);
      router.refresh();
    });
  }

  return (
    <section id="leads-to-approve" className={`${cardClass} relative p-5 sm:p-6`} data-testid="leads-to-approve">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{t.kicker}</p>
        <h2 className="text-lg font-semibold text-neutral-900">{t.title}</h2>
        <p className="text-sm text-neutral-500">{t.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {([
          ["CA", t.canada, pendingCa, "leads-tab-ca"],
          ["US", t.usa, pendingUs, "leads-tab-us"],
        ] as const).map(([country, label, count, testid]) => {
          const active = query.country === country;
          return (
            <Link
              key={country}
              href={hrefFor(query, { country, page: 1 }, preserve)}
              role="tab"
              aria-selected={active}
              data-testid={testid}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                active ? "bg-[#1E4ED8] text-white" : "border border-neutral-300 bg-white text-neutral-800"
              }`}
            >
              {label}
              <span className={`ml-2 text-xs ${active ? "text-white/90" : "text-neutral-500"}`}>{t.pending(count)}</span>
            </Link>
          );
        })}
      </div>

      {runApplied ? (
        <p className="mb-3 rounded-lg bg-[#1E4ED8]/10 px-3 py-2 text-sm text-[#1E4ED8]" data-testid="leads-run-banner">
          {t.runBanner}{" "}
          <Link href={hrefFor({ ...query, run: "", added: "" }, { page: 1 }, preserve)} className="font-semibold underline">
            {t.clearRun}
          </Link>
        </p>
      ) : null}

      <form method="get" action="/admin/dashboard#leads-to-approve" className="mb-4 flex flex-wrap items-end gap-2" data-testid="leads-filters">
        {Object.entries(preserve).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}
        {query.country !== "CA" ? <input type="hidden" name="leadCountry" value={query.country} /> : null}
        {query.run ? <input type="hidden" name="leadRun" value={query.run} /> : null}
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.statusLabel}
          <select name="leadStatus" defaultValue={query.status} className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm">
            {FILTERS.map((status) => (
              <option key={status} value={status}>
                {t.statuses[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.from}
          <input type="date" name="leadFrom" defaultValue={query.from} className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm" />
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.to}
          <input type="date" name="leadTo" defaultValue={query.to} className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm" />
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t.contact}
          <select name="leadComplete" defaultValue={query.complete} className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm">
            <option value="">{t.allContacts}</option>
            <option value="complete">{t.onlyComplete}</option>
            <option value="incomplete">{t.onlyIncomplete}</option>
          </select>
        </label>
        <button type="submit" className="h-9 rounded-lg bg-[#1E4ED8] px-3 text-xs font-semibold text-white">
          {t.apply}
        </button>
        <Link href={hrefFor({ ...query, status: "pending", from: "", to: "", complete: "", page: 1, run: "", added: "" }, {}, preserve)} className="h-9 rounded-lg border border-neutral-300 px-3 text-xs leading-9 text-neutral-700">
          {t.clear}
        </Link>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs" data-testid="leads-table">
          <thead className="uppercase tracking-wider text-neutral-500">
            <tr className="border-b border-neutral-200">
              <th className="py-2 pr-2">
                <input
                  type="checkbox"
                  aria-label={t.selectAll}
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? [] : openIds)}
                />
              </th>
              <th className="py-2 pr-2">{t.brokerage}</th>
              <th className="py-2 pr-2">{query.country === "US" ? t.townUs : t.townCa}</th>
              <th className="py-2 pr-2">{t.person}</th>
              <th className="py-2 pr-2">{t.phone}</th>
              <th className="py-2 pr-2">{t.email}</th>
              <th className="py-2 pr-2">{t.code}</th>
              <th className="py-2 pr-2">{t.status}</th>
              <th className="py-2 pr-2">{t.added}</th>
              <th className="py-2">{t.complete}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const gaps = contactGaps(row);
              const status = leadStatusKey(row, flagged);
              const open = row.status === "pending" || row.status === "on_hold";
              return (
                <tr key={row.id} id={`lead-${row.id}`} className="border-b border-neutral-100 align-top" data-testid={`lead-row-${row.id}`}>
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      aria-label={t.selectRow}
                      disabled={!open}
                      checked={selected.includes(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td className="py-2 pr-2 font-semibold text-neutral-900">{row.brokerage}</td>
                  <td className="py-2 pr-2 text-neutral-700">{[row.town, row.province].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-2 pr-2">
                    <form
                      id={`lead-edit-${row.id}`}
                      className="flex items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (preview) return;
                        const fd = new FormData(e.currentTarget);
                        fd.set("id", row.id);
                        start(async () => {
                          setMsg(null);
                          const res = await updateProspectContactAction(fd);
                          setMsg(res.ok ? t.saved : t.failed);
                          if (res.ok) router.refresh();
                        });
                      }}
                    >
                      <input name="contact_first_name" aria-label={t.first} defaultValue={row.contact_first_name ?? ""} className={input} />
                      <input name="contact_last_name" aria-label={t.last} defaultValue={row.contact_last_name ?? ""} className={input} />
                      <button type="submit" disabled={pending || preview} className="h-8 shrink-0 rounded-md bg-neutral-900 px-2 font-semibold text-white disabled:opacity-50">
                        {pending ? t.saving : t.save}
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-2">
                    <input form={`lead-edit-${row.id}`} name="contact_phone" aria-label={t.phone} defaultValue={row.contact_phone ?? ""} className={input} />
                  </td>
                  <td className="py-2 pr-2">
                    <input form={`lead-edit-${row.id}`} name="contact_email" aria-label={t.email} defaultValue={row.contact_email ?? ""} className={`${input} min-w-[11rem]`} />
                  </td>
                  <td className="py-2 pr-2 font-mono font-semibold text-neutral-800">
                    {row.proposed_code ? row.proposed_code.toUpperCase() : t.codePending}
                  </td>
                  <td className="py-2 pr-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700">{t.statuses[status]}</span>
                  </td>
                  <td className="py-2 pr-2 text-neutral-600">{istDay(row.created_at)}</td>
                  <td className="py-2">
                    {gaps.length ? (
                      <span className="font-semibold text-amber-800" data-testid="lead-incomplete">
                        {t.missing} {gapText(locale, gaps)}
                      </span>
                    ) : (
                      <span className="font-semibold text-green-700" data-testid="lead-complete">
                        {t.completeYes}
                      </span>
                    )}
                    <DisqualifyBrokerageControl
                      locale={locale}
                      prospectQueueId={row.id}
                      fastCode={row.proposed_code}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length ? <p className="py-6 text-sm text-neutral-500">{t.empty}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
        <p>{t.page(query.page, pageCount, total)}</p>
        <span className="flex gap-2">
          {query.page > 1 ? (
            <Link href={hrefFor(query, { page: query.page - 1 }, preserve)} className="rounded-lg border border-neutral-300 px-3 py-1 font-semibold text-neutral-800">
              {t.prev}
            </Link>
          ) : null}
          {query.page < pageCount ? (
            <Link href={hrefFor(query, { page: query.page + 1 }, preserve)} className="rounded-lg border border-neutral-300 px-3 py-1 font-semibold text-neutral-800">
              {t.next}
            </Link>
          ) : null}
        </span>
      </div>

      <div className="sticky bottom-3 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur" data-testid="leads-sticky-bar">
        <span className="text-xs font-semibold text-neutral-700">{selected.length ? t.selected(selected.length) : t.noneSelected}</span>
        <button type="button" disabled={pending || !selected.length} onClick={() => decide("approved", selected)} className="h-8 rounded-lg bg-[#1E4ED8] px-3 text-xs font-semibold text-white disabled:opacity-40">
          {t.approveSelected}
        </button>
        <button type="button" disabled={pending || !selected.length} onClick={() => decide("rejected", selected)} className="h-8 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-800 disabled:opacity-40">
          {t.rejectSelected}
        </button>
        <button type="button" disabled={pending || !completeIds.length} onClick={() => decide("approved", completeIds)} className="h-8 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-800 disabled:opacity-40" data-testid="approve-complete-in-view">
          {t.approveComplete}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-neutral-700" data-testid="leads-action-message">{msg}</p> : null}

      <ProspectCsvImport locale={locale} preview={preview} />
    </section>
  );
}
