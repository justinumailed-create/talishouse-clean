import BusinessOfficePage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/business-office");
}

export default function Page() {
  return <BusinessOfficePage />;
}
