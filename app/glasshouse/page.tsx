import GlasshousePage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/glasshouse");
}

export default function Page() {
  return <GlasshousePage />;
}
