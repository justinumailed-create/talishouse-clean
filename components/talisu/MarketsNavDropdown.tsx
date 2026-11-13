"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TALISU_MKTS_HEADER_MARKETS_DROPDOWN } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";

function itemActive(href: string, pathname: string): boolean {
  if (href === "/talisu/mkts") return pathname === "/talisu/mkts";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Blue-navbar Markets menu: USA and Canada. Visible before anyone is signed in. */
export default function MarketsNavDropdown() {
  const pathname = usePathname() || "";
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const active = TALISU_MKTS_HEADER_MARKETS_DROPDOWN.some((item) => itemActive(item.href, pathname));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid="nav-markets-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
          active || open ? "bg-white/20 text-white" : "text-white hover:bg-white/15"
        }`}
      >
        {t.nav.markets}
        <svg aria-hidden viewBox="0 0 12 8" className={`h-2.5 w-2.5 transition ${open ? "rotate-180" : ""}`} fill="none">
          <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-1.5 min-w-[9.5rem] overflow-hidden rounded-lg border border-white/20 bg-[#035bb8] py-1 shadow-lg"
        >
          {TALISU_MKTS_HEADER_MARKETS_DROPDOWN.map((item) => {
            const label = item.menuKey === "usa" ? t.nav.marketsMenu.usa : t.nav.marketsMenu.canada;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                data-testid={item.menuKey === "usa" ? "nav-markets-usa" : "nav-markets-canada"}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2 text-[13px] font-medium transition sm:text-[14px] ${
                  itemActive(item.href, pathname) ? "bg-white/20 text-white" : "text-white/95 hover:bg-white/15"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
