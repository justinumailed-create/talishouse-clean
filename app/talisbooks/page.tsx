import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = createMetadata({
  title: TALISBOOKS_PRODUCT_NAME,
  description:
    "Explore Talisbooks™ — browse digital lookbooks and branded publications. Mapsite™ pins your place on the map so buyers and partners can find your story.",
  path: "/talisbooks",
  image: false,
});

export const dynamic = "force-dynamic";

interface TalisBooksPublicBookshelfPageProps {
  searchParams: Promise<{
    fastCode?: string;
  }>;
}

export default async function TalisBooksPublicBookshelfPage({
  searchParams,
}: TalisBooksPublicBookshelfPageProps) {
  const params = await searchParams;
  const fastCode = params.fastCode?.trim().toLowerCase() || "";
  if (fastCode) {
    redirect(`${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(fastCode)}`);
  }
  const bookshelf = await getPublicTalisBooksBookshelf();
  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
