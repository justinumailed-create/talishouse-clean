import RegisterProductCheckout from "@/components/talisu/RegisterProductCheckout";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/register/adpro");
}

export default function AdproCheckoutPage() {
  return <RegisterProductCheckout product="adpro" />;
}
