import BuildMapSitePage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/build-mapsite");
}

export default function Page() {
  return <BuildMapSitePage />;
}
