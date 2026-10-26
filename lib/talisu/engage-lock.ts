import { ROUTES } from "@/lib/routes";
import {
  TALISU_ASK_STEP_PARAM,
  TALISU_ENGAGE_CHECKOUT_STEP,
} from "@/lib/talisu/ask-step";
import {
  CATALOGUE_PRODUCT_PARAM,
  findCatalogueProduct,
  type CatalogueProduct,
} from "@/lib/talisu/catalogue-products";

/**
 * Engage lock (Arun, Oct 26 correction): Thorsten P's page is its own path,
 * separate from Aisha's registration page. The $2,000 CAD down payment on
 * /talisu/engage stays locked until at least one catalogue design (P-code)
 * is selected; nothing else is required. The single "Engage Thorsten P"
 * button is the only way to ?step=pay, and the pay step re-checks it on the
 * server.
 */
export const ENGAGE_LOCK_PARAM = "locked";

export type EngageLockReason = "design";

/** ?locked= value from a bounced pay URL; anything else is ignored. */
export function normalizeEngageLockReason(
  value: string | string[] | null | undefined,
): EngageLockReason | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return raw === "design" ? raw : null;
}

/**
 * Valid catalogue products from ?product= (comma-separated and/or repeated),
 * de-duplicated, in the order given. Unknown codes are dropped.
 */
export function parseEngageProducts(
  value: string | string[] | null | undefined,
): CatalogueProduct[] {
  const raw = (Array.isArray(value) ? value : value ? [value] : []).flatMap((v) =>
    v.split(","),
  );
  const seen = new Set<string>();
  const products: CatalogueProduct[] = [];
  for (const part of raw) {
    const product = findCatalogueProduct(part);
    if (product && !seen.has(product.code)) {
      seen.add(product.code);
      products.push(product);
    }
  }
  return products;
}

/** "design" while no valid design is selected, else null (unlocked). */
export function engageLockReason(
  productCodes: readonly string[],
): EngageLockReason | null {
  return productCodes.some((code) => findCatalogueProduct(code)) ? null : "design";
}

/** The one route to the down payment: ?step=pay&product=P03,P07. */
export function engagePayHref(productCodes: readonly string[]): string {
  const params = new URLSearchParams({
    [TALISU_ASK_STEP_PARAM]: TALISU_ENGAGE_CHECKOUT_STEP,
  });
  const codes = productCodes.filter((code) => findCatalogueProduct(code));
  if (codes.length) params.set(CATALOGUE_PRODUCT_PARAM, codes.join(","));
  return `${ROUTES.TALISU_ENGAGE}?${params.toString().replace(/%2C/g, ",")}`;
}

/** Where a locked pay URL is sent back to: the landing with the reason. */
export function engageLockedHref(reason: EngageLockReason): string {
  const params = new URLSearchParams({ [ENGAGE_LOCK_PARAM]: reason });
  return `${ROUTES.TALISU_ENGAGE}?${params.toString()}`;
}

/**
 * SamCart down-payment URL tagged with every selected design. The existing
 * tagging is one `product` custom parameter plus `utm_content`; SamCart keeps
 * one value per query key, so several designs ride in those same two keys as
 * a comma-separated list (product=P03,P07). One design is unchanged
 * (product=P07).
 */
export function engageProductsCheckoutUrl(
  baseUrl: string,
  products: readonly Pick<CatalogueProduct, "code">[],
): string {
  if (!products.length) return baseUrl;
  const codes = products.map((p) => p.code).join(",");
  const url = new URL(baseUrl);
  url.searchParams.set(CATALOGUE_PRODUCT_PARAM, codes);
  url.searchParams.set("utm_content", codes);
  return url.toString();
}
