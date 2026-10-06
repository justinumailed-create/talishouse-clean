import type { Locale } from "@/lib/i18n/config";
import type { Localized } from "@/lib/i18n/types";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";

/** Shape every locale must provide (keys from English, string values). */
export type Dictionary = Localized<typeof en>;

const DICTIONARIES: Record<Locale, Dictionary> = { en, de };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export { en, de };
