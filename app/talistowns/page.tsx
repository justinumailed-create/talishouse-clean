import TalistownsPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talistowns");
}

export default function Page() {
  return <TalistownsPage />;
}
