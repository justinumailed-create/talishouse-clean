import TalisprosRegisterPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/register");
}

export default function Page() {
  return <TalisprosRegisterPage />;
}
