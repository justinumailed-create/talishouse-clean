"use client";

import { useTransition } from "react";
import { logoutMapSiteOwnerSession } from "@/app/talispros/mapsites/actions";

interface MapSiteOwnerLogoutButtonProps {
  fastCode: string | null | undefined;
  accountType?: string | null;
  className?: string;
}

/**
 * Paid / owner claimed Mapsite™ control: clear owner + root-account cookies
 * and reload the claimed URL as a public visitor.
 */
export default function MapSiteOwnerLogoutButton({
  fastCode,
  accountType = null,
  className = "",
}: MapSiteOwnerLogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await logoutMapSiteOwnerSession({
            fastCode,
            accountType,
          });
          window.location.assign(result.href);
        });
      }}
      className={
        className ||
        "relative z-10 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white disabled:opacity-50"
      }
      aria-label="Log out of Mapsite™ owner session"
    >
      {isPending ? "Logging out…" : "Logout"}
    </button>
  );
}
