import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "@/app/agent/AgentAuthShell";
import { AgentLoginForm } from "@/app/agent/AgentAuthForm";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { agentChangePasswordPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export async function generateMetadata() {
  return pageMetadata("/associate");
}

export const dynamic = "force-dynamic";

/** Direct Associate Portal entry: login when signed out, dashboard when signed in. */
export default async function AssociatePortalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Only a same-origin /admin/agent… path is ever honoured (no open redirect).
  const returnTo = agentReturnFromSearchParams(await searchParams);
  const account = await getAdminSessionAccount();
  if (account?.access === "agent") {
    if (account.mustChangePassword) redirect(agentChangePasswordPath(returnTo));
    if (returnTo) redirect(returnTo);
    redirect("/admin/agent");
  }

  return (
    <AgentAuthShell
      title="Sign in to your associate account"
      subtitle="Use the login ID and password from your administrator."
      below={
        <>
          Global Admin?{" "}
          <Link href="/admin/login" className="font-medium text-[#1E4ED8] hover:underline">
            Sign in with your FAST Code
          </Link>
        </>
      }
    >
      <AgentLoginForm returnTo={returnTo} />
    </AgentAuthShell>
  );
}
