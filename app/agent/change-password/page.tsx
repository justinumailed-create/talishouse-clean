import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "../AgentAuthShell";
import { AgentChangePasswordForm } from "../AgentAuthForm";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { agentLoginPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export async function generateMetadata() {
  return pageMetadata("/agent/change-password");
}

export const dynamic = "force-dynamic";

export default async function AgentChangePasswordPage({
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
