import { TALISU_MARKETS_COPY } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Markets served",
  description: TALISU_MARKETS_COPY.body,
  path: "/talisu/mkts",
});

/**
 * First-party Talismaps™ rebuild of the live Atlist Markets UI
 * (talisu.com/mkts). Flag pins + sidebar + Next Step… → /talisu/demo.
 */
export default function TalisUMarketsPage() {
  return <TalisUMarketsMapApp />;
}
