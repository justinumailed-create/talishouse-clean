"use client";

import Script from "next/script";

const SAMCART_CHECKOUT_SCRIPT = "https://static.samcart.com/checkouts/sc-checkout.js";

/**
 * Official SamCart web-component embed. next/script loads sc-checkout.js once
 * per session (same src is not injected again on later checkouts).
 * Render this only after the agent-code gate. The product slug is a prop so
 * it is not on the page until that check has passed.
 */
export default function SamCartWebCheckout({
  product,
  subdomain,
}: {
  product: string;
  subdomain: string;
}) {
  return (
    <div className="w-full min-w-0" data-testid="samcart-web-checkout">
      <Script id="samcart-sc-checkout" src={SAMCART_CHECKOUT_SCRIPT} strategy="afterInteractive" />
      <sc-checkout
        product={product}
        subdomain={subdomain}
        coupon=""
        style={{ display: "block", width: "100%", maxWidth: "100%" }}
      />
    </div>
  );
}
