import Link from "next/link";
import { redirect } from "next/navigation";
import LeadForm from "@/components/admin/crm/LeadForm";
import { PageHeader, cardClass } from "@/components/admin/agents/ui";
import { crmCopy } from "@/lib/crm-leads/copy";
import type { LeadField } from "@/lib/crm-leads/model";
import { requireCrmActor } from "@/lib/crm-leads/server";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/admin/agent/leads/new");
}

export const dynamic = "force-dynamic";

const BLANK: Record<LeadField, string> = {
  decision_maker_name: "",
  position: "",
  cell_phone: "",
  email: "",
  brokerage_name: "",
  brokerage_website: "",
  brokerage_address: "",
  office_phone: "",
  latitude: "",
  longitude: "",
  country: "Canada",
  market: "",
  status: "new",
  notes: "",
};

export default async function NewBrokerageLeadPage() {
  const actor = await requireCrmActor();
  if (!actor) redirect("/admin/agent");
  const copy = crmCopy(await getLocale());
  return (
    <div className="space-y-6">
      <PageHeader
        kicker={copy.kicker}
        title={copy.newTitle}
        subtitle={copy.newSubtitle}
        actions={<Link href="/admin/agent/leads" className="text-sm font-semibold text-[#1E4ED8]">{copy.back}</Link>}
      />
      <div className={`${cardClass} p-4 sm:p-6`}>
        <LeadForm initial={BLANK} />
      </div>
    </div>
  );
}
