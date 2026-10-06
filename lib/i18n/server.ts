import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Active UI locale for Server Components / generateMetadata / Server Actions.
 * `?lang=` (forwarded by middleware as a header) wins over the cookie.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const headerStore = await headers();
    const fromHeader = headerStore.get(LOCALE_HEADER);
    if (isLocale(fromHeader)) return fromHeader;
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) return fromCookie;
  } catch {
    // Outside a request scope (build-time / tests) → English.
  }
  return DEFAULT_LOCALE;
}

/** Server-side `t`: the full typed dictionary for the active locale. */
export async function getT() {
  return getDictionary(await getLocale());
}
