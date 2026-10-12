import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/demo-mapsite");
}

export const dynamic = "force-dynamic";

export default function DemoMapSiteBuilderPage() {
  return <DemoMapSiteBuilderClient />;
}
