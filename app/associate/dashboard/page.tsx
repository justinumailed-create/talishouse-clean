import AssociateDashboardPage from "./page-client";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Associate Dashboard");
}

export default function Page() {
  return <AssociateDashboardPage />;
}
