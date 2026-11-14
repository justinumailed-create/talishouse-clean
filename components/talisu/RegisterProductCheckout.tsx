import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import RegisterCheckoutAlign from "@/components/talisu/RegisterCheckoutAlign";
import SamCartWebCheckout from "@/components/talisu/SamCartWebCheckout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import { ROUTES } from "@/lib/routes";
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
  const sidebar = (checkout && "sidebar" in checkout ? checkout.sidebar : "").trim();

  return (
    <div className="talis-working-bg text-neutral-950" data-testid={`register-checkout-${product}`}>
      <RegisterCheckoutAlign />
      <div
        className="register-checkout-grid mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-4 lg:items-start"
        data-testid="register-checkout-grid"
      >
        <aside
          className="register-checkout-aside flex flex-col bg-[#f6f3ee] lg:col-span-1"
          data-testid="register-checkout-aside"
        >
          <div className="relative h-[220px] shrink-0 sm:h-[260px] lg:h-[300px]">
            <Image
              src={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
              alt={copy.leaderLine}
              fill
              priority
              sizes="(min-width: 1024px) 25vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-14 text-white">
              <div className="text-[18px] font-semibold leading-tight">{copy.leaderLine}</div>
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
          <div className="min-h-8 flex-1" aria-hidden="true" />
          <div className="flex flex-col gap-3 px-4 pb-5 pt-2">
            <Link
              href={ROUTES.TERMS}
              data-testid="register-checkout-terms"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#046BD9] px-6 text-center text-[15px] font-semibold leading-none text-white shadow-[0_6px_14px_rgba(4,107,217,0.28)] transition hover:bg-[#0358b3]"
            >
              {copy.actions.consentTerms}
            </Link>
            <Link
              href={ROUTES.PRIVACY}
              data-testid="register-checkout-privacy"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#046BD9] bg-white px-6 text-center text-[15px] font-semibold leading-none text-[#046BD9] transition hover:bg-[#EAF3FF]"
            >
              {copy.actions.consentPrivacy}
            </Link>
          </div>
        </aside>
        <div className="min-w-0 w-full px-3 py-4 sm:px-5 lg:col-span-3 lg:py-6">
          <SamCartWebCheckout product={samcartProduct} subdomain={SAMCART_CHECKOUT_SUBDOMAIN} />
        </div>
      </div>
    </div>
  );
}
