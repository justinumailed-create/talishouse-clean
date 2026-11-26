import { redirect } from "next/navigation";
import AishaTranscriptsList from "@/components/admin/agent/AishaTranscriptsList";
import { PageHeader } from "@/components/admin/ui";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope, isGlobalAdmin } from "@/lib/admin-constants";
import { AISHA_TRANSCRIPTS_SCOPE } from "@/lib/aisha-transcript-routing";
import { listRoutedAishaTranscripts } from "@/lib/aisha-transcript-ingest";
import { agentChangePasswordPath, agentLoginPath } from "@/lib/agent-return-path";

export const dynamic = "force-dynamic";

export default async function AssociateAishaTranscriptsPage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect(agentLoginPath("/admin/agent/transcripts"));
  if (account.mustChangePassword) redirect(agentChangePasswordPath("/admin/agent/transcripts"));

  const canView =
    isGlobalAdmin(account) || (account.access === "agent" && accountHasAdminScope(account, AISHA_TRANSCRIPTS_SCOPE));
  if (!canView) redirect("/admin/agent");

  const transcripts = await listRoutedAishaTranscripts({
    all: isGlobalAdmin(account),
    assigneeId: isGlobalAdmin(account) ? null : account.agentId ?? null,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Associate portal"
        title="Aisha transcripts"
        subtitle="New ended Aisha calls where a human caller spoke, routed as potential prospects. Historical calls from before this queue was set up are not included. Internal test calls are excluded."
      />
      <AishaTranscriptsList
        transcripts={transcripts}
        emptyLabel="No new Aisha transcripts have been routed yet. Qualifying calls will appear here after they end."
      />
    </div>
  );
}
