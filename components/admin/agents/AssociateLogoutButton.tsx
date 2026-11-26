"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAdminAction } from "@/app/admin/actions";
import { clearAdminSession } from "@/lib/fast-code";
import { agentLoginPath } from "@/lib/agent-return-path";

/**
 * Associate Dashboard Logout: ends the associate session right away (same
 * server action as the sidebar Logout) and returns to the Associate Portal
 * sign-in at /associate, so another associate can sign in on this device.
 */
export default function AssociateLogoutButton({
  label = "Logout",
  pendingLabel = "Logging out…",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      data-testid="associate-logout"
      aria-label={label}
      onClick={() => {
        startTransition(async () => {
          await logoutAdminAction();
          clearAdminSession();
          router.replace(agentLoginPath());
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      {pending ? pendingLabel : label}
    </button>
  );
}
