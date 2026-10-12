export const dynamic = "force-dynamic"
export const revalidate = 0

import ApplyClient from "./ApplyClient"
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/business-office/apply");
}

export default function Page() {
  return <ApplyClient />
}
