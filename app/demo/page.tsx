import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/demo");
}

export const dynamic = "force-dynamic";

export { default } from "../talispros/demo-mapsite/page";
