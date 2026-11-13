import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * SamCart's checkout web component (`sc-checkout`), defined by
 * https://static.samcart.com/checkouts/sc-checkout.js
 */
type ScCheckoutProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  product: string;
  subdomain: string;
  coupon?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sc-checkout": ScCheckoutProps;
    }
  }
}

export {};
