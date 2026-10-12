import PartnerAccessPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/partner-access");
}

export default function Page() {
  return <PartnerAccessPage />;
}
