import { notFound, redirect } from "next/navigation";
import LeadCrmClient from "@/components/admin/agents/LeadCrmClient";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { flowAccess } from "@/lib/talispros/call-flow";
import { flowUi } from "@/lib/talispros/call-flow-copy";
import { loadLeadFlow } from "@/lib/talispros/call-flow-server";
import { adminHomePath, isGlobalAdmin } from "@/lib/admin-constants";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AgentLeadFlowPage({ params }: { params: Promise<{ code: string }> }) {
  const account = await getAdminSessionAccount();
  if (!account) redirect("/agent/login");
  const access = flowAccess(account);
  if (!access) redirect(adminHomePath(account));
  if (account.access === "agent" && account.mustChangePassword) redirect("/agent/change-password");
  const { code } = await params;
  const locale = (await getLocale()) === "de" ? "de" : "en";
  const bundle = await loadLeadFlow(
    code,
    { access, agentId: account.agentId ?? null, name: account.name, globalAdmin: isGlobalAdmin(account) },
    locale,
  );
  if (!bundle) notFound();
  return <LeadCrmClient bundle={bundle} ui={flowUi(locale)} locale={locale} />;
}
