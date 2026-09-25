import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { createMetadata } from "@/lib/seo";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
} from "@/lib/talispros/mapsite-og-image";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import { ROUTES } from "@/lib/routes";

const publicShelfCopy = bookshelfSeoCopy({});

export const metadata: Metadata = createMetadata({
  title: publicShelfCopy.title,
  description:
    "Explore Talisbooks™ — browse digital lookbooks and branded publications on the standing-book bookshelf. Mapsite™ pins your place on the map so buyers and partners can find your story.",
  path: "/talisbooks",
  image: bookshelfOgMetadataImage(publicShelfCopy.title),
});

export const dynamic = "force-dynamic";

interface TalisBooksPublicBookshelfPageProps {
  searchParams: Promise<{
    fastCode?: string;
    from?: string;
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
  return (
    <TalisBooksLibraryShell
      bookshelf={bookshelf}
      backHref={mapsiteBackFromScheduleHref(params.from)}
    />
  );
}
