"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutMapSiteOwnerSession } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";

interface MapSiteOwnerLogoutButtonProps {
  fastCode: string | null | undefined;
  accountType?: string | null;
  className?: string;
}

/**
 * Paid / owner claimed Mapsite control: clear owner + root-account cookies
 * and reload the claimed URL as a public visitor.
 */
export default function MapSiteOwnerLogoutButton({
  fastCode,
  accountType = null,
  className = "",
}: MapSiteOwnerLogoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useT();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(event) => {
        event.stopPropagation();
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
        "relative z-10 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
      }
      aria-label={t.mapsite.logoutAria}
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      {isPending ? t.mapsite.loggingOut : t.mapsite.logout}
    </button>
  );
}
