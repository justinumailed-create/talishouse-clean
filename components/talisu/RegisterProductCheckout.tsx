import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import SamCartWebCheckout from "@/components/talisu/SamCartWebCheckout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import { hasCheckoutAccess } from "@/lib/talisu/register-entry";
import {
  isRegisterCheckoutId,
  type RegisterCheckoutId,
} from "@/lib/talisu/register-checkout";
import {
  registerCheckoutProduct,
  SAMCART_CHECKOUT_SUBDOMAIN,
} from "@/lib/talisu/register-checkout.server";

/**
 * Product checkout: Aisha's portrait at about 25%, SamCart at about 75%.
 * The official sc-checkout element is returned only after the agent-code gate,
 * so the product embed is not in the HTML before verification.
 */
export default async function RegisterProductCheckout({
  product,
}: {
  product: RegisterCheckoutId;
}) {
  if (!isRegisterCheckoutId(product)) notFound();
  if (!(await hasCheckoutAccess())) {
    redirect(`/talisu/reg?locked=code&product=${product}`);
  }
  const samcartProduct = registerCheckoutProduct(product);
  if (!samcartProduct) notFound();

  const copy = getDictionary(await getLocale()).talisu.register;
  const checkout = copy.actions.checkouts.find((item) => item.id === product);
  const label = checkout?.label ?? product;
  const sidebar = (checkout && "sidebar" in checkout ? checkout.sidebar : "").trim();

  return (
    <div className="talis-working-bg text-neutral-950" data-testid={`register-checkout-${product}`}>
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-4 lg:items-start">
        <aside
          className={
            sidebar
              ? "flex flex-col bg-[#f6f3ee] lg:sticky lg:top-16 lg:col-span-1 lg:max-h-[calc(100dvh-4.5rem)] lg:overflow-y-auto"
              : "relative min-h-[220px] sm:min-h-[280px] lg:sticky lg:top-16 lg:col-span-1 lg:min-h-[calc(100dvh-4.5rem)]"
          }
        >
          <div className={sidebar ? "relative h-[220px] shrink-0 sm:h-[260px] lg:h-[300px]" : "absolute inset-0"}>
            <Image
              src={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
              alt="Aisha C."
              fill
              priority
              sizes="(min-width: 1024px) 25vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-14 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                {copy.partnerHeading}
              </div>
              <div className="mt-1 text-[18px] font-semibold leading-tight">{copy.partnerName}</div>
              <div className="mt-1 text-[13px] leading-snug text-white/90">{label}</div>
            </div>
          </div>
          {sidebar ? (
            <div
              className="px-4 py-4 text-[14px] leading-relaxed text-neutral-800 sm:text-[15px] sm:leading-relaxed"
              data-testid={`register-checkout-sidebar-${product}`}
            >
              {sidebar}
            </div>
          ) : null}
        </aside>
        <div className="min-w-0 w-full px-3 py-4 sm:px-5 lg:col-span-3 lg:py-6">
          <SamCartWebCheckout product={samcartProduct} subdomain={SAMCART_CHECKOUT_SUBDOMAIN} />
        </div>
      </div>
    </div>
  );
}
