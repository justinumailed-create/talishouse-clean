import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "../AgentAuthShell";
import { AgentLoginForm } from "../AgentAuthForm";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getChatOnLogin } from "@/lib/chat/server";

export async function generateMetadata() {
  return pageMetadata("/agent/login");
}

export const dynamic = "force-dynamic";

export default async function AgentLoginPage() {
  const account = await getAdminSessionAccount();
  if (account?.access === "agent") {
    if (account.mustChangePassword) redirect("/agent/change-password");
    redirect(account.agentId && (await getChatOnLogin(account.agentId)) ? "/chat" : "/admin/agent");
  }

  return (
    <AgentAuthShell
      title="Sign in to your agent account"
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
      <AgentLoginForm />
    </AgentAuthShell>
  );
}
