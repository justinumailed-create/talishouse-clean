"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAdminSession } from "@/lib/fast-code";
import { clearTalisprosAdminAuthSession } from "./actions";

export default function TalisprosAdminLogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={isSigningOut}
      onClick={async () => {
        setIsSigningOut(true);
        await clearTalisprosAdminAuthSession();
        clearAdminSession();
        router.push("/talispros/admin/login");
        router.refresh();
      }}
      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
    >
      {isSigningOut ? "Signing out..." : "Log out"}
    </button>
  );
}
