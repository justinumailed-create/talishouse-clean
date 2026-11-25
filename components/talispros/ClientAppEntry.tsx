"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import TalisprosSamCartReturnBanner from "@/components/talispros/TalisprosSamCartReturnBanner";
import { getFastCode, setFastCode } from "@/lib/fast-code";
import { useT } from "@/lib/i18n/client";
import { isShortHomeFastCode } from "@/lib/talispros/fast-code-shape";

/**
 * Public /app entry: enter a FAST Code™ once on this device (localStorage,
 * no database). Later visits prefill it. After a SamCart success return,
 * the same page accepts orderid / email query params.
 */
export default function ClientAppEntry() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TalisUMktsHeader />
      <Suspense fallback={null}>
        <TalisprosSamCartReturnBanner />
      </Suspense>
      <ClientAppForm />
    </div>
  );
}

function ClientAppForm() {
  const t = useT().appPage;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [remembered, setRemembered] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getFastCode()?.trim() || "";
    if (stored) {
      setRemembered(stored);
      setValue(stored);
    }
  }, []);

  async function openSite(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError(t.errEmpty);
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await openClaimedMapSiteFromHomeFastCode(trimmed);
      if (!result.success || !result.href) {
        setError(result.error || t.errOpen);
        inputRef.current?.focus();
        setLoading(false);
        return;
      }
      setFastCode(trimmed);
      const code = trimmed.toLowerCase();
      const href = isShortHomeFastCode(code) ? `/${code}` : result.href;
      window.location.assign(href);
    } catch {
      setError(t.errOpen);
      inputRef.current?.focus();
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void openSite(value);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
      <h1 className="m-0 text-[28px] font-semibold tracking-tight text-neutral-950">
        {t.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">{t.intro}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3" aria-label={t.title}>
        <label htmlFor="app-fast-code" className="text-[13px] font-semibold text-neutral-800">
          {t.label}
        </label>
        <input
          id="app-fast-code"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.placeholder}
          className="h-12 rounded-xl border border-neutral-300 px-3 text-[16px] text-neutral-950 outline-none ring-[#046BD9] focus:border-[#046BD9] focus:ring-2"
        />
        {error ? (
          <p className="m-0 text-[13px] text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 items-center justify-center rounded-full bg-[#046BD9] text-[16px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3] disabled:opacity-70"
        >
          {loading ? t.opening : remembered && value.trim().toUpperCase() === remembered.toUpperCase() ? t.rememberedCta : t.submit}
        </button>
      </form>
    </main>
  );
}
