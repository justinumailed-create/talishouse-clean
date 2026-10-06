"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TALISU_MKTS_HEADER_REGISTER_DROPDOWN } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";

function isRegisterHrefActive(pathname: string, href: string) {
  const path = href.split("#")[0] || href;
  if (path === "/catalogue") return pathname === "/catalogue";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function RegisterNavDropdown() {
  const pathname = usePathname() || "";
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const registerActive = TALISU_MKTS_HEADER_REGISTER_DROPDOWN.some((item) =>
    isRegisterHrefActive(pathname, item.href),
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
          registerActive || open
            ? "bg-white/20 text-white"
            : "text-white hover:bg-white/15"
        }`}
      >
        {t.nav.register}
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
          {TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((item) => {
            const active = isRegisterHrefActive(pathname, item.href);
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
                {item.label === "Product"
                  ? t.nav.registerMenu.product
                  : t.nav.registerMenu.mapsite}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
