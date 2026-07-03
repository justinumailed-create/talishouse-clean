"use client";

import { useTransition } from "react";
import { signOutClientAnalytics } from "@/app/talispros/client/actions";

export default function ClientSignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOutClientAnalytics())}
      className="text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
