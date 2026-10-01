"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_TAGLINE,
} from "@/lib/talisu/markets-pins";
import { TALISU_REGISTER } from "@/lib/talisu/content";
import {
  TALISU_KB_NEXT_QUERY,
  TALISU_KB_UNLOCK_QUERY,
  readTalisUKbUnlocked,
} from "@/lib/talisu/kb-gate";
import { TALISU_KB_PATH } from "@/lib/talisu/kb-content";
import TalisBrandFlip from "@/components/talisu/TalisBrandFlip";
import TalisUKbUnlockForm from "@/components/talisu/TalisUKbUnlockForm";

export type TalisUMktsHeaderVariant = "default" | "claimed-mapsite";

export type TalisUMktsHeaderProps = {
  /**
   * `claimed-mapsite`: replace Register with Dashboard (lock until real payment).
   * `default`: Markets + Register (homepage /talisu chrome).
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
}: TalisUMktsHeaderProps = {}) {
  const pathname = usePathname() || "/talisu/mkts";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<DropdownPanel>("menu");
  const [kbUnlocked, setKbUnlocked] = useState(false);
  const [kbNext, setKbNext] = useState(TALISU_KB_PATH);
  const [registerPromptOpen, setRegisterPromptOpen] = useState(false);
  const menuId = useId();
  const promptTitleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const claimedMapsite = variant === "claimed-mapsite";

  const dropdownActive = TALISU_MKTS_HEADER_DROPDOWN.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    setKbUnlocked(readTalisUKbUnlocked());
  }, []);

  // Direct hits to /talisu/kb (or manage) redirect here with ?kbUnlock=1&kbNext=…
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(TALISU_KB_UNLOCK_QUERY) !== "1") return;
    const next = params.get(TALISU_KB_NEXT_QUERY) || TALISU_KB_PATH;
    setKbNext(next);
    if (readTalisUKbUnlocked()) {
      router.replace(next);
      return;
    }
    setPanel("kb-unlock");
    setOpen(true);
  }, [pathname, router]);

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

  function handleDashboardClick() {
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
    // Drop unlock query if present, then open the KB dashboard / manage UI.
    router.replace(destination);
  }

  function handleTalisUToggle() {
    setOpen((value) => {
      const next = !value;
      if (!next) setPanel("menu");
      return next;
    });
  }

  return (
    <header
      className="sticky top-0 z-40 shrink-0 text-white shadow-sm"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 pb-3 sm:px-5 sm:pb-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href="/talisu" className="shrink-0 self-start">
            <Image
              src="/talisu/mkts/talisu-mark.png"
              alt="TalisU™"
              width={40}
              height={43}
              className="h-10 w-auto rounded-sm object-contain object-top sm:h-11"
              priority
            />
          </Link>
          <TalisBrandFlip tagline={TALISU_MKTS_HEADER_TAGLINE} />
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
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
              TalisU
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
                className={`absolute right-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] shadow-lg ${
                  panel === "kb-unlock"
                    ? "w-[min(92vw,16.5rem)] p-3"
                    : "min-w-[11.5rem] py-1"
                }`}
              >
                {panel === "kb-unlock" ? (
                  <div>
                    <button
                      type="button"
                      className="mb-2 text-[12px] font-medium text-white/80 transition hover:text-white"
                      onClick={() => setPanel("menu")}
                    >
                      ← Menu
                    </button>
                    <TalisUKbUnlockForm
                      variant="navbar"
                      onSuccess={handleKbUnlockSuccess}
                    />
                  </div>
                ) : (
                  TALISU_MKTS_HEADER_DROPDOWN.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const isKb = item.href === TALISU_KB_PATH;
                    if (isKb) {
                      return (
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
                          {item.label}
                        </button>
                      );
                    }
                    return (
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
                        {item.label}
                      </Link>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          {TALISU_MKTS_HEADER_NAV.map((item) => {
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
                    Dashboard
                  </button>
                  {registerPromptOpen && !dashboardUnlocked ? (
                    <div
                      ref={promptRef}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby={promptTitleId}
                      className="absolute right-0 z-50 mt-1.5 w-[min(92vw,16.5rem)] overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] p-3 shadow-lg"
                    >
                      <p
                        id={promptTitleId}
                        className="text-[13px] font-semibold text-white"
                      >
                        Dashboard is locked
                      </p>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/90">
                        Register to unlock your Mapsite™ Dashboard after payment
                        succeeds.
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
                        Register
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            }

            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white hover:bg-white/15"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
