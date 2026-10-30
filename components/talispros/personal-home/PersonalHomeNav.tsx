"use client";

import Image from "next/image";
import Link from "next/link";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import TalisBrandMark from "@/components/talisu/TalisBrandMark";
import { useT } from "@/lib/i18n/client";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_LOGO_HREF,
} from "@/lib/talisu/markets-pins";
import {
  fillPersonalHomeCopy,
  PERSONAL_HOME_OPEN_EDITOR_EVENT,
  type PersonalHomeOwnerPill,
} from "@/lib/talispros/personal-home";

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
}: PersonalHomeNavProps) {
  const { personalHome: t, nav } = useT();

  const ownerPill = owner ? (
    <Link
      href={owner.editHref}
      prefetch={false}
      aria-label={fillPersonalHomeCopy(t.navOwner, { name: owner.name })}
      title={fillPersonalHomeCopy(t.navOwner, { name: owner.name })}
      data-testid="personal-home-nav-owner"
      onClick={(event) => {
        // Already on the home page: open the editor in place.
        if (active === "home") {
          event.preventDefault();
          window.dispatchEvent(new Event(PERSONAL_HOME_OPEN_EDITOR_EVENT));
        }
      }}
      className="inline-flex min-h-9 max-w-[11rem] items-center gap-2 rounded-xl bg-white/20 py-1 pl-1 pr-1 text-[13px] font-semibold text-white no-underline transition hover:bg-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:max-w-[15rem] sm:pr-3 sm:text-[14px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={owner.imageUrl}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/40"
        draggable={false}
      />
      <span className="hidden min-w-0 truncate sm:inline">{owner.name}</span>
    </Link>
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
