import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Agent sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">Talispros™ Agent Admin</p>
        </div>
        <AgentLoginForm />
        <p className="mt-6 text-center text-xs text-neutral-500">
          Global Admin? <Link href="/admin/login" className="underline">Sign in with your FAST Code</Link>
        </p>
      </div>
    </div>
  );
}
