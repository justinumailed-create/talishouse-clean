"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import TalisprosMarketsDropdown from "@/components/talispros/TalisprosMarketsDropdown";

/**
 * Homepage bottom-right: small grey Markets (with upward market-options
 * dropdown) + Global Admin. Same always-on visibility as the former catalogue
 * flipbook header. Sits opposite TalisBOT (bottom-left); z below the bot.
 */
const cornerLinkClass =
  "text-[0.68rem] font-medium leading-none tracking-[0.04em] text-[#78716c] no-underline hover:text-[#44403c] hover:underline px-0.5 py-0.5";

export default function TalisprosHomeCornerLinks() {
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-[900] flex max-w-[min(100vw-5.5rem,18rem)] flex-col items-end gap-1.5 sm:right-6"
      data-testid="home-corner-links"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-1.5">
        <TalisprosMarketsDropdown
          triggerClassName={cornerLinkClass}
          menuAlign="end"
          menuDirection="up"
        />
        <Link
          href={ROUTES.ADMIN_DASHBOARD}
          className={cornerLinkClass}
          data-testid="home-global-admin-link"
        >
          Global Admin
        </Link>
      </div>
    </div>
  );
}
