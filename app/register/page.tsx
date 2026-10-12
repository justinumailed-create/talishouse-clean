import RegisterPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/register");
}

export default function Page() {
  return <RegisterPage />;
}
