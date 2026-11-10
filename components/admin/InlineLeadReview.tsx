"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewProspectAction } from "@/app/admin/dashboard/fast-code-tracker-actions";
import { contactGaps, decisionMakerLabel, type ApprovalLead, type ContactGap } from "@/lib/talispros/prospect-approval";

type Locale = "en" | "de";

const COPY = {
  en: {
    approve: "Approve",
    reject: "Reject",
    hold: "Hold",
    missing: "Cannot approve yet",
    gaps: { name: "name", phone: "phone", email: "email" } as Record<ContactGap, string>,
    failed: "Could not save. Please try again.",
    held: "On hold",
    approved: "Approved",
    rejected: "Rejected",
    code: "FAST Code",
    codePending: "Code pending",
  },
  de: {
    approve: "Freigeben",
    reject: "Ablehnen",
    hold: "Zurückstellen",
    missing: "Freigabe noch nicht möglich",
    gaps: { name: "Name", phone: "Telefon", email: "E-Mail" } as Record<ContactGap, string>,
    failed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    held: "Zurückgestellt",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
    code: "FAST Code",
    codePending: "Code ausstehend",
  },
} as const;

export default function InlineLeadReview({
  locale,
  lead,
  messageId,
  preview = false,
}: {
  locale: Locale;
  lead: ApprovalLead;
  messageId: string;
  preview?: boolean;
}) {
  const t = COPY[locale];
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const gaps = contactGaps(lead);
  const open = lead.status === "pending" || lead.status === "on_hold";
  const person = decisionMakerLabel(lead);

  function act(decision: "approved" | "rejected" | "on_hold") {
    if (preview) {
      setMsg(decision === "approved" ? t.approved : decision === "rejected" ? t.rejected : t.held);
      return;
    }
    const fd = new FormData();
    fd.set("id", lead.id);
    fd.set("decision", decision);
    fd.set("message_id", messageId);
    start(async () => {
      setMsg(null);
      const res = await reviewProspectAction(fd);
      if (!res.ok) {
        setMsg(t.failed);
        return;
      }
      if (res.blocked.length && res.updated === 0) {
        const row = res.blocked[0]!;
        setMsg(row.missing.length ? `${t.missing}: ${row.missing.map((gap) => t.gaps[gap]).join(", ")}` : t.failed);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2" data-testid="talisbot-inline-review">
      <p className="m-0 text-sm font-semibold text-neutral-900">{lead.brokerage}</p>
      <p className="m-0 text-xs text-neutral-600">
        {[lead.town, lead.province].filter(Boolean).join(", ")}
        {person ? ` · ${person}` : ""}
        {lead.contact_phone ? ` · ${lead.contact_phone}` : ""}
        {lead.contact_email ? ` · ${lead.contact_email}` : ""}
      </p>
      <p className="m-0 text-xs text-neutral-700">
        {t.code}: {lead.proposed_code ? lead.proposed_code.toUpperCase() : t.codePending}
      </p>
      {gaps.length ? (
        <p className="m-0 mt-1 text-xs font-semibold text-amber-800" data-testid="inline-review-blocked">
          {t.missing}: {gaps.map((gap) => t.gaps[gap]).join(", ")}
        </p>
      ) : null}
      {open ? (
        <span className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={pending || gaps.length > 0} onClick={() => act("approved")} className="rounded-lg bg-[#1E4ED8] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">
            {t.approve}
          </button>
          <button type="button" disabled={pending} onClick={() => act("rejected")} className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-800">
            {t.reject}
          </button>
          <button type="button" disabled={pending} onClick={() => act("on_hold")} className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-800">
            {t.hold}
          </button>
        </span>
      ) : (
        <p className="m-0 mt-1 text-xs text-neutral-600">{lead.status === "approved" ? t.approved : lead.status === "rejected" ? t.rejected : t.held}</p>
      )}
      {msg ? <p className="m-0 mt-1 text-xs text-neutral-700">{msg}</p> : null}
    </div>
  );
}
