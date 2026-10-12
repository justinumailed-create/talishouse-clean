import TalishouseRecreationalPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talishouse-recreational");
}

export default function Page() {
  return <TalishouseRecreationalPage />;
}
