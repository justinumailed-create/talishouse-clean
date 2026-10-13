"use client";

import Link from "next/link";
import { FormEvent, useId, useRef, useState } from "react";
import { setFastCode } from "@/lib/fast-code";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";

/**
 * FAST Code™ entry card on the Demo Mapsite page (moved out of the old
 * navbar Mapsites dropdown). Enter a FAST Code™ to open your personal Mapsite,
 * plus a secondary Register link to Aisha's /talisu/reg.
 */
export default function DemoFastCodeCard({ className = "" }: { className?: string }) {
  const t = useT();
  const m = t.nav.mapsitesMenu;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fieldId = useId();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

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
        setLoading(false);
        return;
      }
      setFastCode(trimmed);
      // Full navigation so owner/paid Set-Cookie from the action applies.
      window.location.assign(result.href);
    } catch {
      setError(t.common.somethingWrong);
      setLoading(false);
    }
  }

  return (
    <section
      data-testid="demo-fast-code-card"
      aria-labelledby={titleId}
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#046BD9] via-[#0a5fc4] to-[#063f86] p-6 text-white shadow-[0_18px_50px_rgba(4,107,217,0.35)] sm:p-8 ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="15" r="4" />
              <path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2" />
            </svg>
          </span>
          <p className="m-0! text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80!">
            {m.cardKicker}
          </p>
        </div>
        <h2 id={titleId} className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white! sm:text-[30px]">
          {m.cardTitle}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/85!">{m.prompt}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
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
            placeholder={m.placeholder}
            aria-invalid={Boolean(error)}
            className="h-12! min-h-12 min-w-0 flex-1 rounded-full border-0 bg-white px-5! font-mono text-[15px] uppercase tracking-[0.18em] text-neutral-900 shadow-sm placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-white/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-7 text-[15px] font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60"
          >
            {loading ? m.opening : m.submit}
          </button>
        </form>
        {error ? (
          <p className="mt-3 rounded-xl bg-white/95 px-3 py-2 text-[13px] text-red-600!" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/20 pt-5 text-[14px] text-white/85">
          <span>{m.registerPrompt}</span>
          <Link
            href="/talisu/reg"
            data-testid="demo-register-link"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-1.5 font-semibold text-white transition hover:bg-white hover:text-[#046BD9]"
          >
            {m.registerCta}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
