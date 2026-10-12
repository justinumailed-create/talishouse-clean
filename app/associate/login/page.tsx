import AssociateLoginPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/associate/login");
}

export default function Page() {
  return <AssociateLoginPage />;
}
