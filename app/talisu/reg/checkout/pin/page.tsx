import RegisterProductCheckout from "@/components/talisu/RegisterProductCheckout";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/talisu/reg/checkout/pin");
}

export default function PinCheckoutPage() {
  return <RegisterProductCheckout product="pin" />;
}
