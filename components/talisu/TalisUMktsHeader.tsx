"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_REGISTER_DROPDOWN,
} from "@/lib/talisu/markets-pins";
import { ROUTES } from "@/lib/routes";
import {
  readTalisUKbUnlocked,
  TALISU_KB_LOCKED_EVENT,
  TALISU_KB_OPEN_UNLOCK_EVENT,
  TALISU_KB_UNLOCKED_EVENT,
} from "@/lib/talisu/kb-gate";
import { TALISU_KB_PATH } from "@/lib/talisu/kb-content";
import TalisBrandMark from "@/components/talisu/TalisBrandMark";
import TalisUKbUnlockForm from "@/components/talisu/TalisUKbUnlockForm";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import RegisterNavDropdown from "@/components/talisu/RegisterNavDropdown";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { useT } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** English nav label (stable id in TALISU_MKTS_HEADER_NAV) → localized text. */
function navLabel(t: Dictionary, label: string): string {
  switch (label) {
    case "Home":
      return t.nav.home;
    case "Markets":
      return t.nav.markets;
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
    case "Bookshelf":
      return t.nav.bookshelf;
    case "FAQ":
      return t.nav.talisuMenu.faq;
    case "Knowledge Base":
      return t.nav.talisuMenu.knowledgeBase;
    case "Audio":
      return t.nav.talisuMenu.audio;
    case "Video":
      return t.nav.talisuMenu.video;
    case "Talispros":
      return t.nav.talisuMenu.talispros;
    case "Media Directory":
      return t.nav.talisuMenu.mediaDirectory;
    case "Contract":
      return t.nav.talisuMenu.contract;
    default:
      return label;
  }
}

const MOBILE_LINK_CLASS =
  "flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-white transition";
const MOBILE_GROUP_CLASS =
  "mt-2 border-t border-white/25 px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/70";

export type TalisUMktsHeaderVariant = "default" | "claimed-mapsite";

export type TalisUMktsHeaderProps = {
  /**
   * `claimed-mapsite`: replace Register with Dashboard (lock until real payment).
   * `default`: Home + Markets + Mapsites + Catalogue + Register | TalisU (Bookshelf lives in TalisU).
   */
  variant?: TalisUMktsHeaderVariant;
  /**
   * Real activation payment success (not demo-only). Unlocks Dashboard.
   */
  dashboardUnlocked?: boolean;
  /** Destination when locked Dashboard → Register. Always Aisha's /talisu/reg, same tab. */
  registerHref?: string;
  /** When Dashboard is unlocked, open the Mapsite pin dashboard. */
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
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none">
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
  registerHref = ROUTES.TALISU_REGISTER,
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
  // Mobile (< lg): one compact bar; every nav link + EN/DE lives in this menu.
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const claimedMapsite = variant === "claimed-mapsite";
  const dashboardHasMenu =
    claimedMapsite &&
    dashboardUnlocked &&
    Boolean(dashboardMenuItems?.length) &&
    Boolean(onSelectDashboardItem);

  const mapsitesActive =
    pathname.startsWith("/talispros/mapsite") ||
    pathname.startsWith("/mapsite") ||
    pathname.startsWith("/talispros/demo-mapsite");

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
      // Desktop nav is hidden on phones: show the unlock form in the menu.
      setMobileOpen(true);
    }
    window.addEventListener(TALISU_KB_OPEN_UNLOCK_EVENT, onOpenUnlock);
    return () => {
      window.removeEventListener(TALISU_KB_OPEN_UNLOCK_EVENT, onOpenUnlock);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !mobilePanelRef.current?.contains(target)
      ) {
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

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        !mobilePanelRef.current?.contains(target) &&
        !mobileButtonRef.current?.contains(target)
      ) {
        setMobileOpen(false);
        setOpen(false);
        setPanel("menu");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpen(false);
        setPanel("menu");
        mobileButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

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
    if (kbUnlocked || readTalisUKbUnlocked()) setKbUnlocked(true);
    // Always go to the KB: its gate lets signed-in active accounts straight in
    // and opens the FAST Code unlock only for visitors.
    setOpen(false);
    setPanel("menu");
    setMobileOpen(false);
    router.push(TALISU_KB_PATH);
  }

  function handleKbUnlockSuccess() {
    setKbUnlocked(true);
    setMobileOpen(false);
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

  function isNavActive(item: (typeof TALISU_MKTS_HEADER_NAV)[number]) {
    return item.label === "Catalogue" || item.label === "Home"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function renderMobileLink(
    href: string,
    label: string,
    active: boolean,
    indent = false,
  ) {
    return (
      <Link
        key={`m-${href}`}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileOpen(false)}
        className={`${MOBILE_LINK_CLASS} ${indent ? "pl-6" : ""} ${
          active ? "bg-white/20" : "hover:bg-white/15"
        }`}
      >
        {label}
      </Link>
    );
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
            aria-expanded={dashboardUnlocked ? undefined : registerPromptOpen}
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

    // Home (/) and Catalogue (/catalogue) are exact-match so sub-routes don't
    // light them (e.g. /catalogue/bookshelf lights TalisU → Bookshelf, not Catalogue).
    const active =
      item.label === "Catalogue" || item.label === "Home"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={`${item.label}-${item.href}`}
        href={item.href}
        className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
          active ? "bg-white/20 text-white" : "text-white hover:bg-white/15"
        }`}
      >
        {navLabel(t, item.label)}
      </Link>
    );
  }

  return (
    <header
      data-testid="site-header"
      className="talisu-no-print sticky top-0 z-40 shrink-0 font-sans text-white shadow-sm print:hidden"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] flex-nowrap items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:flex-wrap lg:py-2.5 lg:pb-3.5">
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

        <nav className="hidden flex-wrap items-center justify-end gap-1.5 sm:gap-2 lg:flex">
          {TALISU_MKTS_HEADER_NAV.filter((item) => item.label === "Home").map(
            (item) => renderNavLink(item),
          )}
          {TALISU_MKTS_HEADER_NAV.filter(
            (item) => item.label === "Markets",
          ).map((item) => renderNavLink(item))}
          {/* Mapsites: direct link to the Demo Mapsite page (FAST Code card lives there). */}
          <Link
            href={DEMO_MAPSITE_BUILD_PATH}
            data-testid="nav-mapsites-link"
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
              mapsitesActive
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/15"
            }`}
          >
            {t.nav.mapsites}
          </Link>
          {TALISU_MKTS_HEADER_NAV.filter(
            (item) => item.label === "Catalogue",
          ).map((item) => renderNavLink(item))}
          {/* Claimed Mapsites: the Dashboard lives on the left Marketing card;
              the PMC sequence (Talispros → Media Directory → Contract) lives in TalisU. */}
          {/* Paid Mapsite (real activation payment): never show Register. */}
          {claimedMapsite &&
          dashboardUnlocked &&
          !dashboardHasMenu ? null : claimedMapsite && dashboardHasMenu ? (
            TALISU_MKTS_HEADER_NAV.filter(
              (item) => item.label === "Register",
            ).map((item) => renderNavLink(item))
          ) : (
            <RegisterNavDropdown />
          )}

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
                    {TALISU_MKTS_HEADER_DROPDOWN.map((item) => {
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`) ||
                        (item.href.includes("#") &&
                          pathname === item.href.split("#")[0]);
                      const isKb = item.href === TALISU_KB_PATH;
                      // Divider after Video: PMC sequence below it.
                      // Divider after Knowledge Base: Audio + Video below it.
                      const isFaq = item.label === "Knowledge Base";
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
                      // Bookshelf, FAQ, KB, Audio, Video on top — split before the PMC sequence.
                      if (isFaq) {
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
        {/* Mobile (< lg): single compact bar — menu button opens every nav link + EN/DE. */}
        <button
          ref={mobileButtonRef}
          type="button"
          data-testid="mobile-menu-button"
          aria-expanded={mobileOpen}
          aria-controls={mobileMenuId}
          aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            {mobileOpen ? (
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div
          ref={mobilePanelRef}
          id={mobileMenuId}
          data-testid="mobile-menu-panel"
          className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/20 px-3 pt-2 shadow-lg lg:hidden"
          style={{
            backgroundColor: TALISU_MKTS_HEADER_BLUE,
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          {open && panel === "kb-unlock" ? (
            <div className="rounded-2xl bg-white p-4 text-neutral-900">
              <button
                type="button"
                className="mb-3 inline-flex min-h-11 items-center text-[13px] font-medium text-neutral-500 transition hover:text-neutral-800"
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
            <nav aria-label={t.nav.talisu} className="flex flex-col">
              {TALISU_MKTS_HEADER_NAV.filter(
                (item) => item.label === "Home" || item.label === "Markets",
              ).map((item) =>
                renderMobileLink(
                  item.href,
                  navLabel(t, item.label),
                  isNavActive(item),
                ),
              )}
              {renderMobileLink(
                DEMO_MAPSITE_BUILD_PATH,
                t.nav.mapsites,
                mapsitesActive,
              )}
              {TALISU_MKTS_HEADER_NAV.filter(
                (item) => item.label === "Catalogue",
              ).map((item) =>
                renderMobileLink(
                  item.href,
                  navLabel(t, item.label),
                  isNavActive(item),
                ),
              )}

              {claimedMapsite && dashboardHasMenu ? (
                <>
                  <p className={MOBILE_GROUP_CLASS}>{t.nav.dashboard}</p>
                  {dashboardMenuItems!.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        onSelectDashboardItem!(menuItem.id);
                      }}
                      className={`${MOBILE_LINK_CLASS} w-full text-left text-white hover:bg-white/15`}
                    >
                      {(t.mapsite.dashboardMenu as Record<string, string>)[
                        menuItem.id
                      ] ?? menuItem.label}
                    </button>
                  ))}
                </>
              ) : claimedMapsite && !dashboardUnlocked ? (
                <div className="my-1 rounded-lg border border-white/20 p-3">
                  <p className="flex items-center gap-1.5 text-[14px] font-semibold">
                    <LockIcon className="h-3.5 w-3.5 shrink-0" />
                    {t.nav.dashboardLocked.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-snug text-white/90">
                    {t.nav.dashboardLocked.body}
                  </p>
                  <a
                    href={registerHref}
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-3 text-[14px] font-semibold text-[#035bb8]"
                  >
                    {t.nav.dashboardLocked.cta}
                  </a>
                </div>
              ) : claimedMapsite ? null : (
                <>
                  <p className={MOBILE_GROUP_CLASS}>{t.nav.register}</p>
                  {TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((item) =>
                    renderMobileLink(
                      item.href,
                      item.href === "/talisu/reg"
                        ? t.nav.registerMenu.mapsite
                        : t.nav.registerMenu.product,
                      pathname === item.href,
                      true,
                    ),
                  )}
                </>
              )}

              <p className={MOBILE_GROUP_CLASS}>{t.nav.talisu}</p>
              {TALISU_MKTS_HEADER_DROPDOWN.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  (item.href.includes("#") &&
                    pathname === item.href.split("#")[0]);
                if (item.href === TALISU_KB_PATH) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={handleKbMenuClick}
                      className={`${MOBILE_LINK_CLASS} w-full pl-6 text-left ${
                        active ? "bg-white/20" : "hover:bg-white/15"
                      }`}
                    >
                      {talisuMenuLabel(t, item.label)}
                    </button>
                  );
                }
                return renderMobileLink(
                  item.href,
                  talisuMenuLabel(t, item.label),
                  active,
                  true,
                );
              })}

              <div className="mt-2 flex items-center justify-between border-t border-white/25 pt-2">
                <span className="text-[13px] text-white/80">
                  {t.langSwitch.groupLabel}
                </span>
                <LanguageSwitch size="touch" />
              </div>
            </nav>
          )}
        </div>
      ) : null}
    </header>
  );
}
