import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Choose a new password</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {account.mustChangePassword
              ? "Your temporary password must be changed before you continue."
              : `Signed in as ${account.loginId ?? account.name}.`}
          </p>
        </div>
        <AgentChangePasswordForm />
      </div>
    </div>
  );
}
