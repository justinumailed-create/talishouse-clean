import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/mkts");
}

/**
 * First-party Talismaps™ rebuild of the live Atlist Markets UI
 * (talisu.com/mkts). Flag pins + sidebar + Next Step… → /talisu/demo.
 */
export default function TalisUMarketsPage() {
  return <TalisUMarketsMapApp />;
}
