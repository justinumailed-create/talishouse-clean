"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  importProspectContactsCsvAction,
  reviewProspectAction,
  updateProspectContactAction,
} from "@/app/admin/dashboard/fast-code-tracker-actions";

type Locale = "en" | "de";

const COPY = {
  en: {
    approve: "Approve",
    reject: "Reject",
    approved: "Approved",
    edit: "Edit contact",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    first: "First name",
    last: "Last name",
    position: "Position",
    phone: "Phone",
    email: "Email",
    codePending: "Code pending: decision maker name needed",
    missingName: "Add the decision maker’s first and last name before approving.",
    failed: "Could not save. Please try again.",
    importTitle: "Import contacts CSV",
    importHint:
      "Columns: fast_code, brokerage_name, first_name, last_name, position, phone, phone_type, email, town, province, status, source_url. Match by FAST Code or pq:<queue id>. Never changes issued Mapsite codes.",
    importBtn: "Upload CSV",
    importing: "Importing…",
    importDone: (n: number, leads: number) =>
      `Import done: ${n} queue row(s) updated, ${leads} Mapsite lead field set(s) filled.`,
  },
  de: {
    approve: "Freigeben",
    reject: "Ablehnen",
    approved: "Freigegeben",
    edit: "Kontakt bearbeiten",
    save: "Speichern",
    saving: "Speichert …",
    cancel: "Abbrechen",
    first: "Vorname",
    last: "Nachname",
    position: "Position",
    phone: "Telefon",
    email: "E-Mail",
    codePending: "Code ausstehend: Name des Entscheiders fehlt",
    missingName: "Bitte Vor- und Nachname des Entscheiders eintragen, bevor Sie freigeben.",
    failed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    importTitle: "Kontakte-CSV importieren",
    importHint:
      "Spalten: fast_code, brokerage_name, first_name, last_name, position, phone, phone_type, email, town, province, status, source_url. Zuordnung über FAST Code oder pq:<Warteschlangen-ID>. Ändert keine vergebenen Mapsite-Codes.",
    importBtn: "CSV hochladen",
    importing: "Importiert …",
    importDone: (n: number, leads: number) =>
      `Import fertig: ${n} Warteschlangen-Eintrag(e) aktualisiert, ${leads} Mapsite-Lead-Feldgruppe(n) ergänzt.`,
  },
} as const;

export type QueueRow = {
  id: string;
  brokerage: string;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_position: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  office_address: string | null;
  office_phone: string | null;
  website: string | null;
  market: string | null;
  market_rank: number | null;
  town: string | null;
  province: string | null;
  source_url: string;
  status: string;
  proposed_code: string | null;
};

const input = "h-8 w-full rounded-lg border border-neutral-300 bg-white px-2 text-sm text-neutral-900";

export function ProspectQueueRow({ locale, row, labels }: { locale: Locale; row: QueueRow; labels: { rank: string; googleSource: string; source: string; website: string; toResearch: string } }) {
  const t = COPY[locale];
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const codePending = !row.proposed_code;

  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm" data-testid={`prospect-queue-row-${row.id}`}>
      <span className="min-w-[16rem] flex-1">
        <span className="font-semibold text-neutral-900">{row.brokerage}</span>
        <span className="ml-2 text-neutral-500">{[row.town, row.province].filter(Boolean).join(", ")}</span>
        {row.market_rank ? (
          <span className="ml-2 text-xs text-neutral-500">
            {labels.rank} {row.market_rank} · {row.market}
          </span>
        ) : null}
        <a href={row.source_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[#1E4ED8] underline">
          {row.source_url.includes("google.") ? labels.googleSource : labels.source}
        </a>
        {row.website ? (
          <a href={row.website} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[#1E4ED8] underline">
            {labels.website}
          </a>
        ) : null}
        {row.office_address || row.office_phone ? (
          <span className="block text-xs text-neutral-500">{[row.office_address, row.office_phone].filter(Boolean).join(" · ")}</span>
        ) : null}
        {row.contact_name || (row.contact_first_name && row.contact_last_name) ? (
          <span className="block text-xs text-neutral-700">
            {[row.contact_first_name && row.contact_last_name ? `${row.contact_first_name} ${row.contact_last_name}` : row.contact_name, row.contact_position, row.contact_phone, row.contact_email]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : (
          <span className="block text-xs text-amber-700">{labels.toResearch}</span>
        )}
        {codePending ? <span className="block text-xs font-medium text-amber-800">{t.codePending}</span> : null}
        {row.proposed_code ? (
          <span className="mt-0.5 inline-block rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-neutral-800">
            {row.proposed_code.toUpperCase()}
          </span>
        ) : null}

        {editing ? (
          <form
            className="mt-2 grid max-w-xl gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("id", row.id);
              start(async () => {
                setMsg(null);
                const res = await updateProspectContactAction(fd);
                if (!res.ok) setMsg(t.failed);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
          >
            <input name="contact_first_name" defaultValue={row.contact_first_name ?? ""} placeholder={t.first} className={input} required />
            <input name="contact_last_name" defaultValue={row.contact_last_name ?? ""} placeholder={t.last} className={input} required />
            <input name="contact_position" defaultValue={row.contact_position ?? ""} placeholder={t.position} className={input} />
            <input name="contact_phone" defaultValue={row.contact_phone ?? ""} placeholder={t.phone} className={input} />
            <input name="contact_email" defaultValue={row.contact_email ?? ""} placeholder={t.email} className={`${input} sm:col-span-2`} />
            <span className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={pending} className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
                {pending ? t.saving : t.save}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-800">
                {t.cancel}
              </button>
            </span>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="mt-1 text-xs font-semibold text-[#1E4ED8] underline">
            {t.edit}
          </button>
        )}
        {msg ? <span className="block text-xs text-red-700">{msg}</span> : null}
      </span>

      {row.status === "pending" ? (
        <span className="flex flex-col items-end gap-1">
          <span className="flex gap-2">
            {(["approved", "rejected"] as const).map((d) => (
              <button
                key={d}
                type="button"
                disabled={pending}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                onClick={() =>
                  start(async () => {
                    setMsg(null);
                    const fd = new FormData();
                    fd.set("id", row.id);
                    fd.set("decision", d);
                    const res = await reviewProspectAction(fd);
                    if (!res.ok) {
                      setMsg(res.error === "missing_name" ? t.missingName : t.failed);
                      return;
                    }
                    router.refresh();
                  })
                }
              >
                {d === "approved" ? t.approve : t.reject}
              </button>
            ))}
          </span>
        </span>
      ) : (
        <span className="text-xs text-neutral-600">
          {t.approved}
          {row.proposed_code ? ` · ${row.proposed_code.toUpperCase()}` : ""}
        </span>
      )}
    </li>
  );
}

export function ProspectCsvImport({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-3" data-testid="prospect-csv-import">
      <p className="m-0 text-sm font-semibold text-neutral-800">{t.importTitle}</p>
      <p className="mt-1 text-xs text-neutral-500">{t.importHint}</p>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white">
        {pending ? t.importing : t.importBtn}
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            start(async () => {
              setMsg(null);
              const res = await importProspectContactsCsvAction(fd);
              if (!res.ok) {
                setMsg(t.failed);
                return;
              }
              setMsg(t.importDone(res.report.queueUpdated.length, res.report.leadsFilled.length));
              router.refresh();
            });
          }}
        />
      </label>
      {msg ? <p className="mt-2 text-xs text-neutral-700">{msg}</p> : null}
    </div>
  );
}
