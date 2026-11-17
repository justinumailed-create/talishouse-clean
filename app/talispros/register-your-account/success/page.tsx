import RegisterSuccessPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/register-your-account/success");
}

export default function Page() {
  return <RegisterSuccessPage />;
}
