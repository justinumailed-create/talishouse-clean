import SubscriptionPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/subscription");
}

export default function Page() {
  return <SubscriptionPage />;
}
