import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteLeadButton from "@/components/admin/crm/DeleteLeadButton";
import LeadForm from "@/components/admin/crm/LeadForm";
import { PageHeader, cardClass } from "@/components/admin/agents/ui";
import { crmCopy, fill } from "@/lib/crm-leads/copy";
import { canDeleteLeads, canEditLead } from "@/lib/crm-leads/model";
import { getBrokerageLead, leadFormValues, listLeadEdits, requireCrmActor } from "@/lib/crm-leads/server";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/admin/agent/leads/[id]");
}

export const dynamic = "force-dynamic";

function when(iso: string, locale: "en" | "de"): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(iso));
}

export default async function BrokerageLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCrmActor();
  if (!actor) redirect("/admin/agent");
  const { id } = await params;
  const lead = await getBrokerageLead(actor, id);
  if (!lead) notFound();
  const locale = await getLocale();
  const copy = crmCopy(locale);
  const editable = canEditLead(actor, lead);
  const edits = await listLeadEdits(lead.id);
  const actionLabel = { create: copy.historyCreate, update: copy.historyUpdate, import: copy.historyImport };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={copy.kicker}
        title={editable ? copy.editTitle : copy.viewTitle}
        subtitle={editable ? fill(copy.addedBy, { name: lead.createdByName }) : copy.viewSubtitle}
        actions={
          <>
            <Link href="/admin/agent/leads" className="text-sm font-semibold text-[#1E4ED8]">{copy.back}</Link>
            {canDeleteLeads(actor) ? <DeleteLeadButton leadId={lead.id} name={lead.decisionMakerName} /> : null}
          </>
        }
      />
      {!editable ? <p className="rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-700">{copy.readOnly}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className={`${cardClass} p-4 sm:p-6`}>
          <LeadForm leadId={lead.id} initial={leadFormValues(lead)} readOnly={!editable} />
        </div>
        <aside className={`${cardClass} h-fit p-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{copy.history}</h2>
          {edits.length === 0 ? <p className="mt-3 text-sm text-neutral-500">{copy.historyEmpty}</p> : (
            <ol className="mt-3 space-y-3">
              {edits.map((edit) => (
                <li key={edit.id} className="text-sm">
                  <p className="font-medium text-neutral-900">{actionLabel[edit.action]}</p>
                  <p className="text-neutral-500">{fill(copy.by, { name: edit.actorName })} · {when(edit.createdAt, locale)}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
