import Link from "next/link";
import { redirect } from "next/navigation";
import CsvImportClient from "@/components/admin/crm/CsvImportClient";
import { PageHeader } from "@/components/admin/agents/ui";
import { crmCopy } from "@/lib/crm-leads/copy";
import { requireCrmActor } from "@/lib/crm-leads/server";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/admin/agent/leads/import");
}

export const dynamic = "force-dynamic";

export default async function ImportBrokerageLeadsPage() {
  const actor = await requireCrmActor();
  if (!actor) redirect("/admin/agent");
  const copy = crmCopy(await getLocale());
  return (
    <div className="space-y-6">
      <PageHeader
        kicker={copy.kicker}
        title={copy.importTitle}
        subtitle={copy.importSubtitle}
        actions={<Link href="/admin/agent/leads" className="text-sm font-semibold text-[#1E4ED8]">{copy.back}</Link>}
      />
      <CsvImportClient />
    </div>
  );
}
