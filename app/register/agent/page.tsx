import RegisterProductCheckout from "@/components/talisu/RegisterProductCheckout";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/register/agent");
}

export default function AgentCheckoutPage() {
  return <RegisterProductCheckout product="agent" />;
}
