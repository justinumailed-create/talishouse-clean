import MatchResultsPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/match-results");
}

export default function Page() {
  return <MatchResultsPage />;
}
