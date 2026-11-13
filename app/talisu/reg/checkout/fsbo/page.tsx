import RegisterProductCheckout from "@/components/talisu/RegisterProductCheckout";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/talisu/reg/checkout/fsbo");
}

export default function FsboCheckoutPage() {
  return <RegisterProductCheckout product="fsbo" />;
}
