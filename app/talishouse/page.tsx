import TalishouseHome from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talishouse");
}

export default function Page() {
  return <TalishouseHome />;
}
