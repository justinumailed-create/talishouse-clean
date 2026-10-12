import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

export async function generateMetadata() {
  return pageMetadata("/mapsite");
}

/** /mapsite has no index page of its own; send visitors to the public Mapsite markets. */
export default function MapSiteRouterPage() {
  redirect(ROUTES.TALISU_MARKETS);
}
