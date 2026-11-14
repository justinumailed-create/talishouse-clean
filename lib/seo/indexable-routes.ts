import { PAGE_SEO } from "@/lib/seo/page-seo";

/** Routes a public sitemap may list. Noindex pages, including /terms and /privacy, stay out. */
export function indexablePageRoutes(): string[] {
  return Object.entries(PAGE_SEO)
    .filter(([, entry]) => entry.kind === "public" && !entry.noindex)
    .map(([route]) => route);
}
