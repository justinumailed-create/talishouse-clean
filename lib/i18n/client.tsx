"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Root-layout provider; the server passes the locale it rendered with. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Client-side `t`: the typed dictionary for the active locale. */
export function useT(): Dictionary {
  return getDictionary(useContext(LocaleContext));
}
