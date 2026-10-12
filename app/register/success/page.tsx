import RegisterSuccessPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/register/success");
}

export default function Page() {
  return <RegisterSuccessPage />;
}
