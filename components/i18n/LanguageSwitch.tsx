"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { persistLocale, stripLocaleQuery } from "@/lib/i18n/cookie";
import { useLocale, useT } from "@/lib/i18n/client";

/**
 * Blue-navbar language control. Visible order is EN, FR, ES, DE.
 * Only English switches the site. French, Spanish and German are shown
 * blind: grey, not clickable, and with no extra caption. German pages
 * stay available by direct URL (`?lang=de`); this control does not open them.
 */
const SWITCH_ITEMS = [
  { code: "en", label: "EN", enabled: true },
  { code: "fr", label: "FR", enabled: false },
  { code: "es", label: "ES", enabled: false },
  { code: "de", label: "DE", enabled: false },
] as const;

export default function LanguageSwitch({
  className = "",
  size = "default",
}: {
  className?: string;
  /** `touch`: 44px tap targets (mobile header menu). */
  size?: "default" | "touch";
}) {
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

  const names: Record<(typeof SWITCH_ITEMS)[number]["code"], string> = {
    en: t.langSwitch.enName,
    fr: "Français",
    es: "Español",
    de: t.langSwitch.deName,
  };

  return (
    <div
      role="group"
      aria-label={t.langSwitch.groupLabel}
      data-testid="language-switch"
      className={`inline-flex shrink-0 items-center rounded-md text-[12px] font-semibold leading-none sm:text-[13px] ${
        pending ? "opacity-70" : ""
      } ${className}`}
    >
      {SWITCH_ITEMS.map((item, index) => {
        const active = item.enabled && item.code === locale;
        const touch = size === "touch";
        return (
          <span key={item.code} className="inline-flex items-center">
            {index > 0 ? (
              <span aria-hidden className="px-0.5 text-white/55">
                |
              </span>
            ) : null}
            {item.enabled ? (
              <button
                type="button"
                lang={item.code}
                onClick={() => choose("en")}
                aria-pressed={active}
                aria-label={names[item.code]}
                title={names[item.code]}
                className={`rounded transition ${
                  touch
                    ? "inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-[14px]"
                    : "px-1.5 py-1"
                } ${
                  active
                    ? "bg-white text-[#046BD9]"
                    : touch
                      ? "text-white hover:bg-white/15"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ) : (
              <span
                lang={item.code}
                aria-disabled="true"
                aria-label={names[item.code]}
                data-testid={`language-blind-${item.code}`}
                className={`cursor-default select-none text-white/35 ${
                  touch
                    ? "inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-[14px]"
                    : "px-1.5 py-1"
                }`}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
