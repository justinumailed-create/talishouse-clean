"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
} from "@/lib/talisu/markets-pins";
import { TALISU_REGISTER } from "@/lib/talisu/content";
import {
  readTalisUKbUnlocked,
  TALISU_KB_LOCKED_EVENT,
  TALISU_KB_OPEN_UNLOCK_EVENT,
  TALISU_KB_UNLOCKED_EVENT,
} from "@/lib/talisu/kb-gate";
import { TALISU_KB_PATH } from "@/lib/talisu/kb-content";
import TalisBrandMark from "@/components/talisu/TalisBrandMark";
import TalisUKbUnlockForm from "@/components/talisu/TalisUKbUnlockForm";
import MapsitesNavDropdown from "@/components/talisu/MapsitesNavDropdown";
import RegisterNavDropdown from "@/components/talisu/RegisterNavDropdown";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { useT } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** English nav label (stable id in TALISU_MKTS_HEADER_NAV) → localized text. */
function navLabel(t: Dictionary, label: string): string {
  switch (label) {
    case "Markets":
      return t.nav.markets;
    case "Bookshelf":
      return t.nav.bookshelf;
    case "Catalogue":
      return t.nav.catalogue;
    case "Register":
      return t.nav.register;
    default:
      return label;
  }
}

/** English TalisU dropdown label → localized text. */
function talisuMenuLabel(t: Dictionary, label: string): string {
  switch (label) {
    case "FAQ":
      return t.nav.talisuMenu.faq;
    case "Knowledge Base":
      return t.nav.talisuMenu.knowledgeBase;
    case "Audio":
      return t.nav.talisuMenu.audio;
    case "Video":
      return t.nav.talisuMenu.video;
    default:
      return label;
  }
}

export type TalisUMktsHeaderVariant = "default" | "claimed-mapsite";

export type TalisUMktsHeaderProps = {
  /**
   * `claimed-mapsite`: replace Register with Dashboard (lock until real payment).
   * `default`: Markets + Mapsites + Bookshelf + Catalogue + Register (homepage /talisu chrome).
   */
  variant?: TalisUMktsHeaderVariant;
  /**
   * Real activation payment success (not demo-only). Unlocks Dashboard.
   */
  dashboardUnlocked?: boolean;
  /** Destination when locked Dashboard → Register (SamCart / register flow). */
  registerHref?: string;
  /** When Dashboard is unlocked, open the Mapsite™ pin dashboard. */
  onOpenDashboard?: () => void;
  /**
   * Paid owner (or admin) Dashboard dropdown. When set with `dashboardUnlocked`,
   * Dashboard opens a menu (same chrome as TalisU) instead of a single action.
   */
  dashboardMenuItems?: ReadonlyArray<{ id: string; label: string }>;
  /** Called with the chosen dashboard menu item id. */
  onSelectDashboardItem?: (id: string) => void;
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
    >
      <path
        d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="10.25" r="1" fill="currentColor" />
    </svg>
  );
}

type DropdownPanel = "menu" | "kb-unlock";

export default function TalisUMktsHeader({
  variant = "default",
  dashboardUnlocked = false,
  registerHref = TALISU_REGISTER.samcartUrl,
  onOpenDashboard,
  dashboardMenuItems,
  onSelectDashboardItem,
}: TalisUMktsHeaderProps = {}) {
  const pathname = usePathname() || "/talisu/mkts";
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<DropdownPanel>("menu");
  const [kbUnlocked, setKbUnlocked] = useState(false);
  const [kbNext, setKbNext] = useState(TALISU_KB_PATH);
  const [registerPromptOpen, setRegisterPromptOpen] = useState(false);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const dashboardMenuId = useId();
  const dashboardMenuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const promptTitleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const claimedMapsite = variant === "claimed-mapsite";
  const dashboardHasMenu =
    claimedMapsite &&
    dashboardUnlocked &&
    Boolean(dashboardMenuItems?.length) &&
    Boolean(onSelectDashboardItem);

  const dropdownActive = TALISU_MKTS_HEADER_DROPDOWN.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    setKbUnlocked(readTalisUKbUnlocked());

    function onUnlocked() {
      setKbUnlocked(true);
    }
    function onLocked() {
      setKbUnlocked(false);
    }
    window.addEventListener(TALISU_KB_UNLOCKED_EVENT, onUnlocked);
    window.addEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
    return () => {
      window.removeEventListener(TALISU_KB_UNLOCKED_EVENT, onUnlocked);
      window.removeEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
    };
  }, []);

  // Locked /talisu/kb (or manage) asks the header to open unlock in-place — never /talisu?kbUnlock=
  useEffect(() => {
    function onOpenUnlock() {
      if (readTalisUKbUnlocked()) {
        setKbUnlocked(true);
        return;
      }
      const next =
        pathname === TALISU_KB_PATH || pathname.startsWith(`${TALISU_KB_PATH}/`)
          ? pathname
          : TALISU_KB_PATH;
      setKbNext(next);
      setPanel("kb-unlock");
      setOpen(true);
    }
    window.addEventListener(TALISU_KB_OPEN_UNLOCK_EVENT, onOpenUnlock);
    return () => {
      window.removeEventListener(TALISU_KB_OPEN_UNLOCK_EVENT, onOpenUnlock);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPanel("menu");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setPanel("menu");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!registerPromptOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!promptRef.current?.contains(event.target as Node)) {
        setRegisterPromptOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setRegisterPromptOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [registerPromptOpen]);

  useEffect(() => {
    if (!dashboardMenuOpen) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!dashboardMenuRef.current?.contains(event.target as Node)) {
        setDashboardMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDashboardMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dashboardMenuOpen]);

  function handleDashboardClick() {
    if (dashboardHasMenu) {
      setDashboardMenuOpen((value) => !value);
      return;
    }
    if (dashboardUnlocked) {
      onOpenDashboard?.();
      return;
    }
    setRegisterPromptOpen(true);
  }

  function handleKbMenuClick() {
    if (kbUnlocked || readTalisUKbUnlocked()) {
      setKbUnlocked(true);
      setOpen(false);
      setPanel("menu");
      router.push(TALISU_KB_PATH);
      return;
    }
    setKbNext(TALISU_KB_PATH);
    setPanel("kb-unlock");
  }

  function handleKbUnlockSuccess() {
    setKbUnlocked(true);
    setOpen(false);
    setPanel("menu");
    const destination = kbNext || TALISU_KB_PATH;
    // Already on the KB page (inline gate) — stay put; gate listens for unlock event.
    if (
      pathname === destination ||
      pathname.startsWith(`${destination}/`) ||
      pathname === TALISU_KB_PATH ||
      pathname.startsWith(`${TALISU_KB_PATH}/`)
    ) {
      return;
    }
    router.push(destination);
  }

  function handleTalisUToggle() {
    setOpen((value) => {
      const next = !value;
      if (!next) setPanel("menu");
      return next;
    });
  }

  function renderNavLink(item: (typeof TALISU_MKTS_HEADER_NAV)[number]) {
    if (claimedMapsite && item.label === "Register" && dashboardHasMenu) {
      return (
        <div key="dashboard" ref={dashboardMenuRef} className="relative">
          <button
            type="button"
            onClick={handleDashboardClick}
            aria-haspopup="menu"
            aria-expanded={dashboardMenuOpen}
            aria-controls={dashboardMenuId}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
              dashboardMenuOpen
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/15"
            }`}
          >
            {t.nav.dashboard}
            <svg
              aria-hidden
              viewBox="0 0 12 8"
              className={`h-2.5 w-2.5 transition ${dashboardMenuOpen ? "rotate-180" : ""}`}
              fill="none"
            >
              <path
                d="M1 1.5 6 6.5 11 1.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {dashboardMenuOpen ? (
            <div
              id={dashboardMenuId}
              role="menu"
              aria-label={t.nav.dashboard}
              className="absolute right-0 z-50 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] py-1 shadow-lg"
            >
              {dashboardMenuItems!.map((menuItem) => (
                <button
                  key={menuItem.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDashboardMenuOpen(false);
                    onSelectDashboardItem!(menuItem.id);
                  }}
                  className="block w-full whitespace-nowrap px-3.5 py-2 text-left text-[13px] font-medium text-white/95 transition hover:bg-white/15 sm:text-[14px]"
                >
                  {(t.mapsite.dashboardMenu as Record<string, string>)[
                    menuItem.id
                  ] ?? menuItem.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    if (claimedMapsite && item.label === "Register") {
      return (
        <div key="dashboard" className="relative">
          <button
            type="button"
            onClick={handleDashboardClick}
            aria-haspopup={dashboardUnlocked ? undefined : "dialog"}
            aria-expanded={
              dashboardUnlocked ? undefined : registerPromptOpen
            }
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
              registerPromptOpen
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/15"
            }`}
          >
            {!dashboardUnlocked ? (
              <LockIcon className="h-3.5 w-3.5 shrink-0 opacity-95" />
            ) : null}
            {t.nav.dashboard}
          </button>
          {registerPromptOpen && !dashboardUnlocked ? (
            <div
              ref={promptRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={promptTitleId}
              className="absolute right-0 z-50 mt-1.5 w-[16.5rem]! min-w-[16.5rem] max-w-none! overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] p-3 shadow-lg"
            >
              <p
                id={promptTitleId}
                className="text-[13px] font-semibold text-white"
              >
                {t.nav.dashboardLocked.title}
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-white/90">
                {t.nav.dashboardLocked.body}
              </p>
              <a
                href={registerHref}
                target={
                  registerHref.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  registerHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-[13px] font-semibold text-[#035bb8] transition hover:bg-white/95"
                onClick={() => setRegisterPromptOpen(false)}
              >
                {t.nav.dashboardLocked.cta}
              </a>
            </div>
          ) : null}
        </div>
      );
    }

    // Catalogue (/catalogue) is exact-match so /catalogue/bookshelf only lights Bookshelf.
    const active =
      item.label === "Catalogue"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={`${item.label}-${item.href}`}
        href={item.href}
        className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
          active
            ? "bg-white/20 text-white"
            : "text-white hover:bg-white/15"
        }`}
      >
        {navLabel(t, item.label)}
      </Link>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 shrink-0 font-sans text-white shadow-sm"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 pb-3 sm:px-5 sm:pb-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href="/" className="shrink-0 self-start">
            <Image
              src="/talisu/mkts/talisu-mark.png"
              alt="TalisU™"
              width={40}
              height={43}
              className="h-10 w-auto rounded-sm object-contain object-top sm:h-11"
              priority
            />
          </Link>
          <TalisBrandMark tagline={t.nav.tagline} />
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {TALISU_MKTS_HEADER_NAV.filter((item) => item.label === "Markets").map(
            (item) => renderNavLink(item),
          )}
          <MapsitesNavDropdown />
          {TALISU_MKTS_HEADER_NAV.filter((item) => item.label === "Bookshelf").map(
            (item) => renderNavLink(item),
          )}
          {TALISU_MKTS_HEADER_NAV.filter((item) => item.label === "Catalogue").map(
            (item) => renderNavLink(item),
          )}
          {claimedMapsite
            ? TALISU_MKTS_HEADER_NAV.filter(
                (item) => item.label === "Register",
              ).map((item) => renderNavLink(item))
            : <RegisterNavDropdown />}

          <span
            aria-hidden
            className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/45 sm:inline-block"
          />

          <div ref={rootRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={handleTalisUToggle}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
                dropdownActive || open
                  ? "bg-white/20 text-white"
                  : "text-white hover:bg-white/15"
              }`}
            >
              {t.nav.talisu}
              <svg
                aria-hidden
                viewBox="0 0 12 8"
                className={`h-2.5 w-2.5 transition ${open ? "rotate-180" : ""}`}
                fill="none"
              >
                <path
                  d="M1 1.5 6 6.5 11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {open ? (
              <div
                id={menuId}
                role="menu"
                className={
                  panel === "kb-unlock"
                    ? "absolute right-0 z-50 mt-1.5 w-80! min-w-[280px] max-w-none! overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
                    : "absolute right-0 z-50 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] py-1 shadow-lg"
                }
              >
                {panel === "kb-unlock" ? (
                  <div>
                    <button
                      type="button"
                      className="mb-3 text-[12px] font-medium text-neutral-500 transition hover:text-neutral-800"
                      onClick={() => setPanel("menu")}
                    >
                      {t.nav.menuBack}
                    </button>
                    <TalisUKbUnlockForm
                      variant="navbar"
                      onSuccess={handleKbUnlockSuccess}
                    />
                  </div>
                ) : (
                  <>
                    {TALISU_MKTS_HEADER_DROPDOWN.map((item, index) => {
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`) ||
                        (item.href.includes("#") &&
                          pathname === item.href.split("#")[0]);
                      const isKb = item.href === TALISU_KB_PATH;
                      const isFaq = item.label === "FAQ";
                      const row = isKb ? (
                        <button
                          key={item.href}
                          type="button"
                          role="menuitem"
                          onClick={handleKbMenuClick}
                          className={`block w-full px-3.5 py-2 text-left text-[13px] font-medium transition sm:text-[14px] ${
                            active
                              ? "bg-white/20 text-white"
                              : "text-white/95 hover:bg-white/15"
                          }`}
                        >
                          {talisuMenuLabel(t, item.label)}
                        </button>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className={`block px-3.5 py-2 text-[13px] font-medium transition sm:text-[14px] ${
                            active
                              ? "bg-white/20 text-white"
                              : "text-white/95 hover:bg-white/15"
                          }`}
                        >
                          {talisuMenuLabel(t, item.label)}
                        </Link>
                      );
                      // FAQ is first — horizontal split before Knowledge Base / Audio / Video.
                      if (isFaq && index === 0) {
                        return (
                          <div key={`${item.href}-wrap`}>
                            {row}
                            <div
                              role="separator"
                              className="my-1 border-t border-white/25"
                            />
                          </div>
                        );
                      }
                      return row;
                    })}
                  </>
                )}
              </div>
            ) : null}
          </div>

          <LanguageSwitch className="ml-0.5" />
        </nav>
      </div>
    </header>
  );
}
