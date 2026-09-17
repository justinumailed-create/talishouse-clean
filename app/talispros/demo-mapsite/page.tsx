import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Build Demo eBook and Mapsite™",
  description:
    "Place a demonstration pin and attach the pinned Talispros eBook. No FAST Code is issued.",
  path: DEMO_MAPSITE_BUILD_PATH,
});

export default function DemoMapSiteBuilderPage() {
  return <DemoMapSiteBuilderClient />;
}
