"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import TalisBrandMark from "@/components/talisu/TalisBrandMark";
import { useT } from "@/lib/i18n/client";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_LOGO_HREF,
} from "@/lib/talisu/markets-pins";
import type { PersonalHomeOwnerPill } from "@/lib/talispros/personal-home";

type PersonalHomeNavProps = {
  homeHref: string;
  mapsiteHref: string;
  active: "home" | "mapsite";
  /**
   * full: the page's own blue header (logo + Home / Mapsite + EN/DE).
   * sub: slim Home / Mapsite bar under an existing Mapsite header.
   */
  variant?: "full" | "sub";
  /** Account holder pill before Home; passed for the signed-in owner only. */
  owner?: PersonalHomeOwnerPill | null;
  /** Owner/editor: place pins and enter their links. Hidden for public visitors. */
  dashboard?: { unlocked: boolean; onOpen: () => void; active?: boolean } | null;
  /** Talk to us. A WhatsApp (or other) href enables the button; otherwise it is grey. */
  talkHref?: string | null;
  /** Signed-in owner: Logout button so they can switch codes right away. */
  logout?: ReactNode;
};

const LINK =
  "inline-flex min-h-9 items-center rounded-md px-3 py-1.5 text-[13px] font-medium text-white no-underline transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[15px]";

/** Owner navbar: exactly two links, Home (personal home page) and Mapsite. */
export default function PersonalHomeNav({
  homeHref,
  mapsiteHref,
  active,
  variant = "full",
  owner = null,
  dashboard = null,
  talkHref = null,
  logout = null,
}: PersonalHomeNavProps) {
  const { personalHome: t, nav } = useT();

  const ownerPill = owner ? (
    <span
      title={owner.name}
      data-testid="personal-home-nav-owner"
      className="inline-flex min-h-9 max-w-[11rem] select-none items-center gap-2 rounded-xl bg-white/20 py-1 pl-1 pr-1 text-[13px] font-semibold text-white sm:max-w-[15rem] sm:pr-3 sm:text-[14px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={owner.imageUrl}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full bg-white object-cover ring-1 ring-white/40"
        draggable={false}
      />
      <span className="hidden min-w-0 truncate sm:inline">{owner.name}</span>
    </span>
  ) : null;

  const links = (
    <nav
      aria-label={t.navLabel}
      className="flex items-center gap-1 sm:gap-1.5"
      data-testid="personal-home-nav"
    >
      {ownerPill}
      {(
        [
          { key: "home", href: homeHref, label: t.navHome },
          { key: "mapsite", href: mapsiteHref, label: t.navMapsite },
        ] as const
      ).map((item) => {
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            data-testid={`personal-home-nav-${item.key}`}
            className={`${LINK} ${isActive ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            {item.label}
          </Link>
        );
      })}
      {dashboard ? (
        dashboard.unlocked ? (
          <button
            type="button"
            onClick={dashboard.onOpen}
            data-testid="personal-home-nav-dashboard"
            aria-current={dashboard.active ? "page" : undefined}
            className={`${LINK} ${dashboard.active ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            {nav.dashboard}
          </button>
        ) : (
          <span
            data-testid="personal-home-nav-dashboard"
            aria-disabled="true"
            title={nav.dashboardLocked.title}
            className="inline-flex min-h-9 cursor-not-allowed items-center rounded-md px-3 py-1.5 text-[13px] font-medium text-white/45 sm:text-[15px]"
          >
            {nav.dashboard}
          </span>
        )
      ) : null}
      {talkHref != null ? (
        talkHref ? (
          <a
            href={talkHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="personal-home-nav-talk"
            aria-label={t.navTalkAria}
            className={`${LINK} hover:bg-white/15`}
          >
            {t.navTalk}
          </a>
        ) : (
          <span
            data-testid="personal-home-nav-talk"
            aria-disabled="true"
            aria-label={t.navTalk}
            className="inline-flex min-h-9 cursor-not-allowed items-center rounded-md px-3 py-1.5 text-[13px] font-medium text-white/45 sm:text-[15px]"
          >
            {t.navTalk}
          </span>
        )
      ) : null}
      {logout ? (
        <span className="ml-1 inline-flex items-center" data-testid="personal-home-nav-logout">
          {logout}
        </span>
      ) : null}
    </nav>
  );

  if (variant === "sub") {
    return (
      <div
        className="talisu-no-print relative z-30 shrink-0 border-t border-white/15 font-sans text-white print:hidden"
        style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
        data-testid="personal-home-subnav"
      >
        <div className="mx-auto flex max-w-[1920px] items-center gap-2 px-3 py-1 sm:px-5">
          {links}
        </div>
      </div>
    );
  }

  return (
    <header
      data-testid="personal-home-header"
      className="talisu-no-print sticky top-0 z-40 shrink-0 font-sans text-white shadow-sm print:hidden"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5">
        <Link
          href={TALISU_MKTS_HEADER_LOGO_HREF}
          className="flex min-w-0 shrink cursor-pointer select-none items-center gap-2.5 rounded-md text-white no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image
            src="/talisu/mkts/talisu-mark.png"
            alt=""
            width={40}
            height={43}
            draggable={false}
            className="pointer-events-none h-10 w-auto shrink-0 self-start rounded-sm object-contain object-top sm:h-11"
            priority
          />
          <span className="hidden min-w-0 md:block">
            <TalisBrandMark tagline={nav.tagline} />
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {links}
          <LanguageSwitch className="ml-0.5" />
        </div>
      </div>
    </header>
  );
}
