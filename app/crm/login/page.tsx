import CrmLoginPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/crm/login");
}

export default function Page() {
  return <CrmLoginPage />;
}
