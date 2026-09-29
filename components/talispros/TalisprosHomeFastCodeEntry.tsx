"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setFastCode } from "@/lib/fast-code";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";

/**
 * Homepage control: enter a FAST Code → open that code’s claimed Mapsite™
 * with owner/paid session privileges (not the public published shell).
 */
export default function TalisprosHomeFastCodeEntry() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a FAST Code.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await openClaimedMapSiteFromHomeFastCode(trimmed);
      if (!result.success || !result.href) {
        setError(result.error || "Unable to open that Mapsite™.");
        inputRef.current?.focus();
        return;
      }

      setFastCode(trimmed);
      router.push(result.href);
    } catch {
      setError("Something went wrong. Please try again.");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-3.5">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[1200px] flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3"
        aria-label="Open Mapsite™ with FAST Code"
      >
        <label
          htmlFor="home-fast-code"
          className="shrink-0 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 sm:text-left"
        >
          FAST Code™
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
            placeholder="Enter your FAST Code"
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2.5 text-center font-mono text-sm uppercase tracking-[0.18em] text-neutral-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-50 sm:text-left"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "home-fast-code-error" : undefined}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-neutral-900 px-4 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 sm:px-5"
          >
            {loading ? "Opening…" : "Open Mapsite™"}
          </button>
        </div>
      </form>
      {error ? (
        <p
          id="home-fast-code-error"
          role="alert"
          className="mx-auto mt-2 max-w-[1200px] text-center text-xs font-medium text-red-600 sm:text-left"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
