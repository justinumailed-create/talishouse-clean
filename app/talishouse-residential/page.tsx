import TalishouseResidentialPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talishouse-residential");
}

export default function Page() {
  return <TalishouseResidentialPage />;
}
