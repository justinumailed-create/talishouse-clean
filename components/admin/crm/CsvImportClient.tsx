"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importLeadsAction, leadTemplateAction, previewLeadImportAction } from "@/app/admin/agent/leads/actions";
import { cardClass, fieldClass, primaryButton, secondaryButton } from "@/components/admin/agents/ui";
import { crmCopy, fill, issueText } from "@/lib/crm-leads/copy";
import { useLocale } from "@/lib/i18n/client";
import {
  IMPORT_ROW_LIMIT,
  LEAD_FIELDS,
  applyMapping,
  autoMapColumns,
  classifyImportRows,
  csvTemplate,
  parseCsv,
  type ClassifiedRow,
  type LeadField,
} from "@/lib/crm-leads/model";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function duplicateText(copy: ReturnType<typeof crmCopy>, row: ClassifiedRow): string {
  if (!row.duplicate) return "";
  const label = row.duplicate.matchId ? row.duplicate.matchLabel : `${row.duplicate.matchLabel} (${copy.inFile})`;
  if (row.duplicate.reason === "email") return fill(copy.dupEmail, { label });
  if (row.duplicate.reason === "phone") return fill(copy.dupPhone, { label });
  return fill(copy.dupName, { label });
}

export default function CsvImportClient() {
  const copy = crmCopy(useLocale());
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [table, setTable] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<LeadField, number>>>({});
  const [rows, setRows] = useState<ClassifiedRow[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mappedRows = useMemo(() => (table.length ? applyMapping(table, mapping) : []), [table, mapping]);

  function applyPreview(next: ClassifiedRow[]) {
    setRows(next);
    const picks: Record<number, boolean> = {};
    for (const row of next) picks[row.rowNumber] = row.errors.length === 0 && !row.duplicate && Boolean(row.lead);
    setSelected(picks);
  }

  function onFile(file: File | undefined) {
    setBanner(null);
    if (!file) return;
    if (file.size > 1_000_000) {
      setBanner(copy.genericError);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      const head = parsed[0] ?? [];
      if (parsed.length < 2) {
        setBanner(copy.emptyFile);
        setHeaders([]);
        setTable([]);
        setRows([]);
        return;
      }
      if (parsed.length - 1 > IMPORT_ROW_LIMIT) {
        setBanner(fill(copy.tooMany, { max: IMPORT_ROW_LIMIT }));
        return;
      }
      const nextMapping = autoMapColumns(head);
      const nextTable = parsed;
      setFileName(file.name);
      setHeaders(head);
      setTable(nextTable);
      setMapping(nextMapping);
      const local = classifyImportRows({ rows: applyMapping(nextTable, nextMapping), existing: [] });
      applyPreview(local);
      startTransition(async () => {
        const result = await previewLeadImportAction(applyMapping(nextTable, nextMapping));
        if (!result.ok) {
          setBanner(result.error);
          return;
        }
        applyPreview(result.rows);
      });
    };
    reader.readAsText(file);
  }

  function changeMapping(index: number, field: string) {
    const next: Partial<Record<LeadField, number>> = {};
    for (const key of LEAD_FIELDS) {
      const col = mapping[key];
      if (col === undefined || col === index || key === field) continue;
      next[key] = col;
    }
    if ((LEAD_FIELDS as readonly string[]).includes(field)) next[field as LeadField] = index;
    setMapping(next);
    const local = classifyImportRows({ rows: applyMapping(table, next), existing: [] });
    applyPreview(local);
    startTransition(async () => {
      const result = await previewLeadImportAction(applyMapping(table, next));
      if (result.ok) applyPreview(result.rows);
    });
  }

  const selectedRows = mappedRows.filter((row) => selected[row.rowNumber]);
  const readyCount = rows.filter((row) => selected[row.rowNumber] && row.lead && !row.duplicate && row.errors.length === 0).length;

  function importSelected() {
    const required: LeadField[] = ["decision_maker_name", "position", "brokerage_name", "country"];
    if (required.some((field) => mapping[field] === undefined)) {
      setBanner(copy.unmapped);
      return;
    }
    if (readyCount === 0) {
      setBanner(copy.nothingToImport);
      return;
    }
    setBanner(null);
    startTransition(async () => {
      const result = await importLeadsAction(selectedRows);
      if (!result.ok) {
        setBanner(result.error);
        return;
      }
      setBanner(fill(copy.imported, { count: result.imported, skipped: result.skipped }));
      if (result.imported > 0) {
        router.push("/admin/agent/leads");
        router.refresh();
      }
    });
  }

  async function template() {
    const csv = (await leadTemplateAction()) || csvTemplate();
    download("brokerage-leads-template.csv", csv);
  }

  return (
    <div className="space-y-5">
      <div className={`${cardClass} flex flex-wrap items-center gap-3 p-4`}>
        <label className={`${secondaryButton} cursor-pointer`}>
          {copy.chooseFile}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <span className="text-sm text-neutral-600">{fileName || copy.noFile}</span>
        <button type="button" className="ml-auto text-sm font-semibold text-[#1E4ED8]" onClick={template}>
          {copy.template}
        </button>
      </div>

      {headers.length > 0 ? (
        <section className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-neutral-900">{copy.mapping}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {headers.map((header, index) => {
              const current = (Object.entries(mapping).find(([, col]) => col === index)?.[0] ?? "") as string;
              return (
                <label key={`${header}-${index}`} className="text-sm text-neutral-700">
                  <span className="mb-1 block truncate font-medium text-neutral-900">{header || `Column ${index + 1}`}</span>
                  <select className={fieldClass} value={current} onChange={(e) => changeMapping(index, e.target.value)}>
                    <option value="">{copy.ignoreColumn}</option>
                    {LEAD_FIELDS.map((field) => (
                      <option key={field} value={field}>{copy.fields[field]}</option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </section>
      ) : null}

      {rows.length > 0 ? (
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">{copy.preview}</h2>
            <button type="button" className={primaryButton} disabled={pending || readyCount === 0} onClick={importSelected}>
              {pending ? copy.importing : fill(copy.importSelected, { count: readyCount })}
            </button>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">{copy.include}</th>
                  <th className="px-3 py-2">{copy.row}</th>
                  <th className="px-3 py-2">{copy.fields.decision_maker_name}</th>
                  <th className="px-3 py-2">{copy.fields.brokerage_name}</th>
                  <th className="px-3 py-2">{copy.fields.country}</th>
                  <th className="px-3 py-2">{copy.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {rows.map((row) => (
                  <PreviewRow key={row.rowNumber} row={row} copy={copy} checked={Boolean(selected[row.rowNumber])} onToggle={(on) => setSelected((prev) => ({ ...prev, [row.rowNumber]: on }))} />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutral-200 md:hidden">
            {rows.map((row) => (
              <li key={row.rowNumber} className="space-y-2 p-4">
                <PreviewBody row={row} copy={copy} checked={Boolean(selected[row.rowNumber])} onToggle={(on) => setSelected((prev) => ({ ...prev, [row.rowNumber]: on }))} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {banner ? <p className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-800">{banner}</p> : null}
    </div>
  );
}

function PreviewRow({
  row,
  copy,
  checked,
  onToggle,
}: {
  row: ClassifiedRow;
  copy: ReturnType<typeof crmCopy>;
  checked: boolean;
  onToggle: (on: boolean) => void;
}) {
  const blocked = row.errors.length > 0 || Boolean(row.duplicate) || !row.lead;
  const badge = row.errors.length ? copy.error : row.duplicate ? copy.duplicate : copy.ready;
  const tone = row.errors.length ? "bg-red-50 text-red-700" : row.duplicate ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800";
  const name = row.lead?.decisionMakerName || row.displayName || "—";
  const brokerage = row.lead?.brokerageName || row.displayBrokerage || "—";
  const country = row.lead ? `${row.lead.country}${row.lead.market ? ` · ${row.lead.market}` : ""}` : "—";
  return (
    <tr className="align-top">
      <td className="px-3 py-3">
        <input type="checkbox" className="h-5 w-5" checked={checked && !blocked} disabled={blocked} onChange={(e) => onToggle(e.target.checked)} aria-label={copy.include} />
      </td>
      <td className="px-3 py-3 text-neutral-500">{row.rowNumber}</td>
      <td className="px-3 py-3">
        <p className="font-medium text-neutral-900">{name}</p>
        {row.errors.length > 0 ? <p className="mt-1 text-xs text-red-700">{row.errors.map((issue) => issueText(copy, issue)).join(" · ")}</p> : null}
        {row.duplicate ? <p className="mt-1 text-xs text-amber-800">{duplicateText(copy, row)}</p> : null}
      </td>
      <td className="px-3 py-3 text-neutral-700">{brokerage}</td>
      <td className="px-3 py-3 text-neutral-700">{country}</td>
      <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{badge}</span></td>
    </tr>
  );
}

function PreviewBody({
  row,
  copy,
  checked,
  onToggle,
  hideCheck = false,
}: {
  row: ClassifiedRow;
  copy: ReturnType<typeof crmCopy>;
  checked: boolean;
  onToggle: (on: boolean) => void;
  hideCheck?: boolean;
}) {
  const blocked = row.errors.length > 0 || Boolean(row.duplicate) || !row.lead;
  const badge = row.errors.length ? copy.error : row.duplicate ? copy.duplicate : copy.ready;
  const tone = row.errors.length ? "bg-red-50 text-red-700" : row.duplicate ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800";
  return (
    <div className="space-y-1">
      {!hideCheck ? (
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <input type="checkbox" className="h-5 w-5" checked={checked && !blocked} disabled={blocked} onChange={(e) => onToggle(e.target.checked)} />
          {copy.row} {row.rowNumber}
        </label>
      ) : null}
      <p className="font-medium text-neutral-900">
        {row.lead?.decisionMakerName || row.displayName || "—"}{" "}
        <span className="font-normal text-neutral-500">{row.lead?.brokerageName || row.displayBrokerage}</span>
      </p>
      <p className="text-neutral-600">{row.lead ? `${row.lead.country} · ${row.lead.market ?? ""}` : null}</p>
      <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{badge}</p>
      {row.errors.length > 0 ? <p className="text-xs text-red-700">{row.errors.map((issue) => issueText(copy, issue)).join(" · ")}</p> : null}
      {row.duplicate ? <p className="text-xs text-amber-800">{duplicateText(copy, row)}</p> : null}
    </div>
  );
}
