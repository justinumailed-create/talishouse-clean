import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: TALISBOOKS_PRODUCT_NAME,
  description:
    "Browse TalisBooks™ — digital lookbooks and branded publications. Open any cover to read in the TalisBooks™ viewer.",
  path: "/talisbooks",
});

export const dynamic = "force-dynamic";

export default async function TalisBooksPublicBookshelfPage() {
  const bookshelf = await getPublicTalisBooksBookshelf();
  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
