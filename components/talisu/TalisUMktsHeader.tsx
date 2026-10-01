"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_TAGLINE,
} from "@/lib/talisu/markets-pins";

export default function TalisUMktsHeader() {
  const pathname = usePathname() || "/talisu/mkts";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const dropdownActive = TALISU_MKTS_HEADER_DROPDOWN.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-40 shrink-0 text-white shadow-sm"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 pb-3 sm:px-5 sm:pb-3.5">
        <Link href="/talisu" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/talisu/mkts/talisu-mark.png"
            alt="TalisU™"
            width={40}
            height={43}
            className="h-10 w-auto shrink-0 self-start rounded-sm object-contain object-top sm:h-11"
            priority
          />
          <div className="min-w-0 leading-tight">
            <div className="text-base font-bold tracking-wide sm:text-lg">
              TalisU&trade;
            </div>
            <div className="text-[12px] text-white/95 sm:text-[13px]">
              {TALISU_MKTS_HEADER_TAGLINE}
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <div ref={rootRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((value) => !value)}
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
                className="absolute right-0 z-50 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] py-1 shadow-lg"
              >
                {TALISU_MKTS_HEADER_DROPDOWN.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
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
                })}
              </div>
            ) : null}
          </div>

          {TALISU_MKTS_HEADER_NAV.map((item) => {
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
