import { redirect } from "next/navigation";
import AgentPageForm from "@/components/admin/agents/AgentPageForm";
import { requireAdminScopePage } from "@/lib/admin-auth";
import { getAgentById } from "@/lib/agent-admins";
import { updateOwnAgentPageAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AgentOwnPageEditor() {
  const account = await requireAdminScopePage("agent-pages");
  if (account.access !== "agent" || !account.agentId) redirect("/admin/agent");
  const agent = await getAgentById(account.agentId);
  if (!agent) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">My page</h1>
      <AgentPageForm
        save={updateOwnAgentPageAction}
        publicHref={`/associate/${encodeURIComponent(agent.loginId)}`}
        initial={{
          pageHeadline: agent.pageHeadline ?? "",
          pageSubtext: agent.pageSubtext ?? "",
          pageCta: agent.pageCta ?? "",
          pageBio: agent.pageBio ?? "",
          videoUrl: agent.videoUrl ?? "",
          showContactForm: agent.showContactForm,
        }}
      />
    </div>
  );
}
