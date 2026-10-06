"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { persistLocale, stripLocaleQuery } from "@/lib/i18n/cookie";
import { useLocale, useT } from "@/lib/i18n/client";

/**
 * EN | DE switch for the blue navbar. Writes the `talis_locale` cookie,
 * updates `<html lang>`, then re-renders server components in place.
 */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    persistLocale(next, document);
    const cleaned = stripLocaleQuery(window.location.href);
    startTransition(() => {
      if (cleaned) {
        router.replace(cleaned, { scroll: false });
      }
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t.langSwitch.groupLabel}
      data-testid="language-switch"
      className={`inline-flex shrink-0 items-center rounded-md text-[12px] font-semibold leading-none sm:text-[13px] ${
        pending ? "opacity-70" : ""
      } ${className}`}
    >
      {LOCALES.map((code, index) => {
        const active = code === locale;
        return (
          <span key={code} className="inline-flex items-center">
            {index > 0 ? (
              <span aria-hidden className="px-0.5 text-white/55">
                |
              </span>
            ) : null}
            <button
              type="button"
              lang={code}
              onClick={() => choose(code)}
              aria-pressed={active}
              aria-label={code === "en" ? t.langSwitch.enName : t.langSwitch.deName}
              title={code === "en" ? t.langSwitch.enName : t.langSwitch.deName}
              className={`rounded px-1.5 py-1 transition ${
                active
                  ? "bg-white text-[#046BD9]"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              {code === "en" ? t.langSwitch.en : t.langSwitch.de}
            </button>
          </span>
        );
      })}
    </div>
  );
}
