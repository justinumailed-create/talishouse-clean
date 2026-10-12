import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import {
  buildAdminMetadata,
  buildDynamicMetadata,
  buildPageMetadata,
  type PageSeoRoute,
} from "@/lib/seo/page-seo";

/** `export async function generateMetadata() { return pageMetadata("/x"); }` */
export async function pageMetadata(route: PageSeoRoute): Promise<Metadata> {
  return buildPageMetadata(route, await getLocale());
}

/** Internal admin / agent / owner tools: shared Admin card, noindex. */
export async function adminMetadata(title?: string): Promise<Metadata> {
  return buildAdminMetadata(await getLocale(), title);
}

/** Individual Mapsite / book pages: localized copy + generated card. */
export async function dynamicPageMetadata(
  build: (locale: "en" | "de") => Omit<Parameters<typeof buildDynamicMetadata>[0], "locale">,
): Promise<Metadata> {
  const locale = await getLocale();
  return buildDynamicMetadata({ ...build(locale), locale });
}
