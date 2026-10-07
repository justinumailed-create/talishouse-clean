"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { setFastCode } from "@/lib/fast-code";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";

/**
 * Mapsites navbar dropdown — FAST Code™ gate (no public claimed list).
 * PayPal-style light card, matching TalisU KB unlock; Demo Mapsite link kept.
 */
export default function MapsitesNavDropdown() {
  const pathname = usePathname() || "";
  const t = useT();
  const m = t.nav.mapsitesMenu;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const menuId = useId();
  const fieldId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        setError("");
        setLoading(false);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmed = value.trim();
    if (!trimmed) {
      setError(m.errEmpty);
      inputRef.current?.focus();
      return;
    }

    // FAST Codes™ are letters + digits (and hyphens); never & / +.
    if (/[&+]/.test(trimmed) || !/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      setError(m.errChars);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await openClaimedMapSiteFromHomeFastCode(trimmed);
      if (!result.success || !result.href) {
        setError(result.error || m.errOpen);
        inputRef.current?.focus();
        setLoading(false);
        return;
      }

      setFastCode(trimmed);
      setOpen(false);
      // Full navigation so owner/paid Set-Cookie from the action applies.
      window.location.assign(result.href);
    } catch {
      setError(t.common.somethingWrong);
      inputRef.current?.focus();
      setLoading(false);
    }
  }

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
        {t.nav.mapsites}
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
          className="absolute right-0 z-50 mt-1.5 w-80! min-w-[280px] max-w-none! overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-labelledby={titleId}
          >
            <div>
              <p
                id={titleId}
                className="text-[15px] font-semibold tracking-tight text-neutral-900"
              >
                {m.title}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-500">
                {m.prompt}
              </p>
            </div>
            <div>
              <label htmlFor={fieldId} className="sr-only">
                {m.fieldLabel}
              </label>
              <input
                ref={inputRef}
                id={fieldId}
                type="text"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="characters"
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 font-mono text-[14px] uppercase tracking-[0.18em] text-neutral-900 shadow-sm placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[#0070ba] focus:outline-none focus:ring-2 focus:ring-[#0070ba]/25 disabled:opacity-50"
                placeholder={m.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "nav-mapsites-fast-error" : undefined}
                required
              />
            </div>
            {error ? (
              <p
                id="nav-mapsites-fast-error"
                className="text-[13px] text-red-600"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0070ba] text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#005ea6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070ba]/40 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {loading ? m.opening : m.submit}
            </button>
          </form>

          <div className="my-4 border-t border-neutral-200" />

          <Link
            href={DEMO_MAPSITE_BUILD_PATH}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-1 py-1.5 text-[14px] font-medium text-[#0070ba] transition hover:bg-neutral-50 hover:text-[#005ea6]"
          >
            {m.demo}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
