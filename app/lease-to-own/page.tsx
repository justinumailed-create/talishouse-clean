import LeaseToOwnPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/lease-to-own");
}

export default function Page() {
  return <LeaseToOwnPage />;
}
