import MatchFlow from "@/components/MatchFlow";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/find-your-market");
}

export default function FindYourMarketPage() {
  return <MatchFlow />;
}
