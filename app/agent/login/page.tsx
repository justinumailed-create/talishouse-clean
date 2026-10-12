import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "../AgentAuthShell";
import { AgentLoginForm } from "../AgentAuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent Login | Talispros™",
  robots: { index: false, follow: false },
};

export default async function AgentLoginPage() {
  const account = await getAdminSessionAccount();
  if (account?.access === "agent") {
    redirect(account.mustChangePassword ? "/agent/change-password" : "/admin/agent");
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
