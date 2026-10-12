import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import AgentAuthShell from "../AgentAuthShell";
import { AgentChangePasswordForm } from "../AgentAuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Change Password | Talispros™ Agent",
  robots: { index: false, follow: false },
};

export default async function AgentChangePasswordPage() {
  const account = await getAdminSessionAccount();
  if (!account || account.access !== "agent") redirect("/agent/login");

  return (
    <AgentAuthShell
      title="Choose a new password"
      subtitle={
        account.mustChangePassword
          ? "For your security, replace your temporary password before continuing."
          : `Signed in as ${account.loginId ?? account.name}.`
      }
    >
      <AgentChangePasswordForm />
    </AgentAuthShell>
  );
}
