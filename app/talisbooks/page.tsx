import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import { ROUTES } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisbooks");
}


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
