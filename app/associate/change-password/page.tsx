import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "@/app/agent/AgentAuthShell";
import { AgentChangePasswordForm } from "@/app/agent/AgentAuthForm";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { agentLoginPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export async function generateMetadata() {
  return pageMetadata("/associate/change-password");
}

export const dynamic = "force-dynamic";

export default async function AssociateChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = agentReturnFromSearchParams(await searchParams);
  const account = await getAdminSessionAccount();
  if (!account || account.access !== "agent") redirect(agentLoginPath(returnTo));

  return (
    <AgentAuthShell
      title="Choose a new password"
      subtitle={
        account.mustChangePassword
          ? "For your security, replace your temporary password before continuing."
          : `Signed in as ${account.loginId ?? account.name}.`
      }
    >
      <AgentChangePasswordForm returnTo={returnTo} />
    </AgentAuthShell>
  );
}
