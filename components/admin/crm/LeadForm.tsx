"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveLeadAction } from "@/app/admin/agent/leads/actions";
import { countryLabel, crmCopy, issueText, positionLabel, statusLabel } from "@/lib/crm-leads/copy";
import { useLocale } from "@/lib/i18n/client";
import {
  LEAD_COUNTRY_CHOICES,
  LEAD_POSITIONS,
  LEAD_STATUSES,
  validateLeadValues,
  type LeadCountry,
  type LeadField,
} from "@/lib/crm-leads/model";
import { fieldClass, primaryButton, secondaryButton, textareaClass } from "@/components/admin/agents/ui";

const labelClass = "mb-1.5 block text-xs font-medium text-neutral-700";

export default function LeadForm({
  leadId = null,
  initial,
  readOnly = false,
}: {
  leadId?: string | null;
  initial: Record<LeadField, string>;
  readOnly?: boolean;
}) {
  const copy = crmCopy(useLocale());
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set(field: LeadField, value: string) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setError(null);
    const parsed = validateLeadValues(values, {
      storedCountry: initial.country === "USA" ? "USA" : null,
    });
    if (!parsed.lead) {
      setIssues(parsed.errors.map((issue) => issueText(copy, issue)));
      setError(copy.genericError);
      return;
    }
    setIssues([]);
    startTransition(async () => {
      const result = await saveLeadAction(leadId, values);
      if (!result.ok) {
        setIssues(result.issues.map((issue) => issueText(copy, issue)));
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!leadId) router.push(`/admin/agent/leads/${result.id}`);
      router.refresh();
    });
  }

  const countryOptions: readonly LeadCountry[] =
    values.country === "USA" ? ["USA", ...LEAD_COUNTRY_CHOICES] : LEAD_COUNTRY_CHOICES;

  const field = (name: LeadField, control: React.ReactNode, hint?: string) => (
    <label className="block text-sm text-neutral-800">
      <span className={labelClass}>
        {copy.fields[name]}
        {hint ? <span className="ml-2 font-normal text-neutral-400">{hint}</span> : null}
      </span>
      {control}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "decision_maker_name",
          <input className={fieldClass} value={values.decision_maker_name} disabled={readOnly} required autoComplete="name" onChange={(e) => set("decision_maker_name", e.target.value)} />,
          copy.required,
        )}
        {field(
          "position",
          <select className={fieldClass} value={values.position} disabled={readOnly} required onChange={(e) => set("position", e.target.value)}>
            <option value="">{copy.any}</option>
            {LEAD_POSITIONS.map((position) => (
              <option key={position} value={position}>{positionLabel(copy, position)}</option>
            ))}
          </select>,
          copy.required,
        )}
        {field(
          "cell_phone",
          <input className={fieldClass} inputMode="tel" autoComplete="tel" value={values.cell_phone} disabled={readOnly} onChange={(e) => set("cell_phone", e.target.value)} />,
        )}
        {field(
          "email",
          <input type="email" className={fieldClass} autoComplete="email" value={values.email} disabled={readOnly} onChange={(e) => set("email", e.target.value)} />,
        )}
        {field(
          "brokerage_name",
          <input className={fieldClass} value={values.brokerage_name} disabled={readOnly} required autoComplete="organization" onChange={(e) => set("brokerage_name", e.target.value)} />,
          copy.required,
        )}
        {field(
          "brokerage_website",
          <input className={fieldClass} inputMode="url" autoComplete="url" placeholder="https://" value={values.brokerage_website} disabled={readOnly} onChange={(e) => set("brokerage_website", e.target.value)} />,
        )}
        {field(
          "office_phone",
          <input className={fieldClass} inputMode="tel" value={values.office_phone} disabled={readOnly} onChange={(e) => set("office_phone", e.target.value)} />,
        )}
        {field(
          "country",
          <select className={fieldClass} value={values.country} disabled={readOnly} required onChange={(e) => set("country", e.target.value)}>
            <option value="">{copy.any}</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>{countryLabel(copy, country)}</option>
            ))}
          </select>,
          copy.required,
        )}
        {field(
          "market",
          <input className={fieldClass} value={values.market} disabled={readOnly} onChange={(e) => set("market", e.target.value)} />,
        )}
        {field(
          "status",
          <select className={fieldClass} value={values.status} disabled={readOnly} onChange={(e) => set("status", e.target.value)}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>{statusLabel(copy, status)}</option>
            ))}
          </select>,
        )}
        <div className="sm:col-span-2">
          {field(
            "brokerage_address",
            <textarea className={textareaClass} rows={2} autoComplete="street-address" value={values.brokerage_address} disabled={readOnly} onChange={(e) => set("brokerage_address", e.target.value)} />,
          )}
        </div>
        {field(
          "latitude",
          <input className={fieldClass} inputMode="decimal" value={values.latitude} disabled={readOnly} onChange={(e) => set("latitude", e.target.value)} />,
          copy.optional,
        )}
        {field(
          "longitude",
          <input className={fieldClass} inputMode="decimal" value={values.longitude} disabled={readOnly} onChange={(e) => set("longitude", e.target.value)} />,
          copy.latLngHint,
        )}
        <div className="sm:col-span-2">
          {field(
            "notes",
            <textarea className={textareaClass} rows={4} placeholder={copy.notesPlaceholder} value={values.notes} disabled={readOnly} onChange={(e) => set("notes", e.target.value)} />,
          )}
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      {error && issues.length === 0 ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {saved && leadId ? <p className="text-sm text-green-700">{copy.saved}</p> : null}

      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={primaryButton} disabled={pending}>
            {pending ? copy.saving : copy.save}
          </button>
          <button type="button" className={secondaryButton} onClick={() => router.push("/admin/agent/leads")}>
            {copy.cancel}
          </button>
        </div>
      )}
    </form>
  );
}
