import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: TALISBOOKS_PRODUCT_NAME,
  description:
    "Explore Talisbooks™ — browse digital lookbooks and branded publications. Mapsite™ pins your place on the map so buyers and partners can find your story.",
  path: "/talisbooks",
  image: {
    url: "/talisbooks/pinned/og-explore-talisbooks.jpg",
    width: 1200,
    height: 630,
    alt: "Explore Talisbooks™ — sample lookbook with Mapsite™",
  },
});

export const dynamic = "force-dynamic";

export default async function TalisBooksPublicBookshelfPage() {
  const bookshelf = await getPublicTalisBooksBookshelf();
  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
