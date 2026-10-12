import PartnerViewPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/partner-view");
}

export default function Page() {
  return <PartnerViewPage />;
}
