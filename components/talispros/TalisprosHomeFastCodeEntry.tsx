"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { setFastCode } from "@/lib/fast-code";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";

type TalisprosHomeFastCodeEntryProps = {
  /** When true, focus the input as soon as the field is shown (gate reveal). */
  autoFocus?: boolean;
  /** Compact embedded styling for the homepage gate drop-down. */
  embedded?: boolean;
};

/**
 * Homepage control: enter a FAST Code → open that code’s claimed Mapsite
 * with owner/paid session privileges (not the public published shell).
 */
export default function TalisprosHomeFastCodeEntry({
  autoFocus = false,
  embedded = false,
}: TalisprosHomeFastCodeEntryProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const f = t.home.fastCode;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmed = value.trim();
    if (!trimmed) {
      setError(f.errEmpty);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await openClaimedMapSiteFromHomeFastCode(trimmed);
      if (!result.success || !result.href) {
        setError(result.error || f.errOpen);
        inputRef.current?.focus();
        return;
      }

      setFastCode(trimmed);
      // Full document navigation so owner/paid Set-Cookie from the action
      // is applied before the claimed Mapsite RSC reads the session.
      window.location.assign(result.href);
    } catch {
      setError(t.common.somethingWrong);
      inputRef.current?.focus();
      setLoading(false);
    }
  }

  const shellClass = embedded
    ? "bg-white px-0 py-0"
    : "border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-3.5";

  const formClass = embedded
    ? "flex w-full flex-col items-stretch gap-2"
    : "mx-auto flex w-full max-w-[1200px] flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3";

  return (
    <div className={shellClass}>
      <form
        onSubmit={handleSubmit}
        className={formClass}
        aria-label={f.formAria}
      >
        <label
          htmlFor="home-fast-code"
          className={
            embedded
              ? "shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500"
              : "shrink-0 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-left"
          }
        >
          {f.label}
        </label>
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            ref={inputRef}
            id="home-fast-code"
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError("");
            }}
            placeholder={f.placeholder}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            className={
              embedded
                ? "min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2.5 text-left font-mono text-sm uppercase tracking-[0.18em] text-neutral-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-50"
                : "min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2.5 text-center font-mono text-sm uppercase tracking-[0.18em] text-neutral-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-50 sm:text-left"
            }
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "home-fast-code-error" : undefined}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-[var(--talis-nav-blue)] px-4 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-[var(--talis-nav-blue-hover)] active:scale-[0.98] disabled:opacity-50 sm:px-5"
          >
            {loading ? f.opening : f.submit}
          </button>
        </div>
      </form>
      {error ? (
        <p
          id="home-fast-code-error"
          role="alert"
          className={
            embedded
              ? "mt-2 text-left text-xs font-medium text-red-600"
              : "mx-auto mt-2 max-w-[1200px] text-center text-xs font-medium text-red-600 sm:text-left"
          }
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
