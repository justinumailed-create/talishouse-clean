"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TALISU_MKTS_HEADER_MAPSITES_LABEL } from "@/lib/talisu/markets-pins";
import type { NavMapSitesPayload } from "@/lib/talisu/nav-mapsites";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function MapsitesNavDropdown() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [payload, setPayload] = useState<NavMapSitesPayload | null>(null);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  /** Avoid re-fetch cancelling itself when loadState flips to "loading". */
  const fetchGenRef = useRef(0);

  const mapsiteActive =
    pathname.startsWith("/talispros/mapsite") ||
    pathname.startsWith("/mapsite") ||
    pathname.startsWith("/talispros/demo-mapsite");

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

  useEffect(() => {
    if (!open) return;
    if (loadState === "ready" || loadState === "loading") return;

    const gen = ++fetchGenRef.current;
    setLoadState("loading");

    void fetch("/api/talisu/nav-mapsites")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as NavMapSitesPayload;
      })
      .then((data) => {
        if (fetchGenRef.current !== gen) return;
        setPayload(data);
        setLoadState("ready");
      })
      .catch(() => {
        if (fetchGenRef.current !== gen) return;
        setLoadState("error");
      });
  }, [open, loadState]);

  function toggle() {
    setOpen((value) => !value);
  }

  const claimed = payload?.claimed ?? [];
  const demos = payload?.demos ?? [];
  const newDemoHref = payload?.newDemoHref || DEMO_MAPSITE_BUILD_PATH;

  const sectionLabelClass =
    "px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/90";
  const emptyClass = "px-3.5 py-2 text-[12px] text-white/80";
  const itemClass =
    "block px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-white/15 sm:text-[14px]";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
          mapsiteActive || open
            ? "bg-white/20 text-white"
            : "text-white hover:bg-white/15"
        }`}
      >
        {TALISU_MKTS_HEADER_MAPSITES_LABEL}
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
          className="absolute right-0 z-50 mt-1.5 max-h-[min(70vh,28rem)] w-[min(92vw,18rem)] overflow-y-auto rounded-lg border border-white/25 bg-[#035bb8] py-1 shadow-lg"
        >
          <p className={sectionLabelClass}>Claimed Mapsites™</p>
          {loadState === "loading" || loadState === "idle" ? (
            <p className={emptyClass}>Loading…</p>
          ) : loadState === "error" ? (
            <p className={emptyClass}>Could not load Mapsites™.</p>
          ) : claimed.length === 0 ? (
            <p className={emptyClass}>No claimed Mapsites™ yet.</p>
          ) : (
            claimed.map((item) => (
              <Link
                key={`claimed-${item.id}`}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <span className="block truncate">{item.label}</span>
                <span className="mt-0.5 block truncate text-[11px] font-normal text-white/75">
                  {item.sublabel}
                </span>
              </Link>
            ))
          )}

          <div className="my-1 border-t border-white/25" />

          <p className={`${sectionLabelClass} pt-1`}>Demo Mapsites™</p>
          <Link
            href={newDemoHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            Build Demo Mapsite™
          </Link>
          {loadState === "ready" && demos.length === 0 ? (
            <p className={emptyClass}>No demo Mapsites™ yet.</p>
          ) : null}
          {demos.map((item) => (
            <Link
              key={`demo-${item.id}`}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <span className="block truncate">{item.label}</span>
              <span className="mt-0.5 block truncate text-[11px] font-normal text-white/75">
                {item.sublabel}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
