"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";
import { useT } from "@/lib/i18n/client";

/** Homepage left column mounts the TalisBOT launcher into this slot. */
export const HOME_TALISBOT_SLOT_ID = "home-talisbot-slot";

/**
 * Homepage left column, directly under the TalisBOT launcher: a small
 * always-visible Markets block (title + four audience links, each with its
 * eyebrow) then Global Admin. Same always-on visibility as the former
 * catalogue flipbook header — no admin gate, no dropdown.
 */
const linkClass =
  "text-[0.68rem] font-medium leading-snug tracking-[0.04em] text-[#78716c] no-underline hover:text-[#44403c] hover:underline";

export default function TalisprosHomeCornerLinks() {
  const t = useT();

  return (
    <div
      className="flex shrink-0 flex-col items-start gap-3 pb-6 pl-6 pr-4 pt-2 font-sans"
      data-testid="home-corner-links"
    >
      <div
        id={HOME_TALISBOT_SLOT_ID}
        data-testid="home-talisbot-slot"
        className="h-[70px] w-[70px] shrink-0"
      />
      <div className="flex max-w-[16rem] flex-col items-start gap-1.5" data-testid="home-markets-block">
        <p className="text-[0.68rem] font-medium leading-none tracking-[0.04em] text-[#78716c]">
          {t.home.corner.markets}
        </p>
        <ul className="flex flex-col items-start gap-1.5">
          {TALISPROS_MARKET_OPTIONS.map((option, index) => {
            const segment = t.home.segments[index];
            return (
              <li key={option.href}>
                <Link
                  href={option.href}
                  className={`${linkClass} block`}
                  data-testid="home-market-link"
                >
                  <span className="block text-[9px] font-medium uppercase leading-none tracking-[0.12em] text-[#a8a29e]">
                    {segment?.label ?? option.label}
                  </span>
                  <span className="mt-0.5 block leading-snug">
                    {segment?.title ?? option.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Link
        href={ROUTES.ADMIN_DASHBOARD}
        className={linkClass}
        data-testid="home-global-admin-link"
      >
        {t.home.corner.globalAdmin}
      </Link>
    </div>
  );
}
