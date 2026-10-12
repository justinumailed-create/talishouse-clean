import RegistrationSuccessPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/registration-success");
}

export default function Page() {
  return <RegistrationSuccessPage />;
}
