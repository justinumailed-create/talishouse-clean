"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutMapSiteOwnerSession } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";

interface MapSiteOwnerLogoutButtonProps {
  fastCode: string | null | undefined;
  accountType?: string | null;
  className?: string;
  /**
   * nav: white door icon for the blue Personal Home / Mapsite nav bar.
   * light: neutral door icon for light surfaces (card footer fallback when
   * the blue nav is not shown).
   */
  variant?: "nav" | "light";
}

const VARIANT_CLASS: Record<"nav" | "light", string> = {
  nav: "inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50",
  light:
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700 disabled:opacity-50",
};

/**
 * Paid / owner claimed Mapsite control: clear owner + root-account cookies
 * and reload the claimed URL as a public visitor.
 */
export default function MapSiteOwnerLogoutButton({
  fastCode,
  accountType = null,
  className = "",
  variant = "nav",
}: MapSiteOwnerLogoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useT();
  const label = isPending ? t.mapsite.loggingOut : t.mapsite.logoutAria;

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
      className={className || VARIANT_CLASS[variant]}
      aria-label={label}
      title={label}
      aria-busy={isPending || undefined}
    >
      <LogOut className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
