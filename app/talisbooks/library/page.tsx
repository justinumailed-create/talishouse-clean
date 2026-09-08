import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = createMetadata({
  title: `Library | ${TALISBOOKS_PRODUCT_NAME}`,
  description:
    "Personal Talisbooks™ bookshelf for Root and Derivative accounts — search, sort, and filter published lookbooks.",
  path: "/talisbooks/library",
  private: true,
  image: false,
});

export const dynamic = "force-dynamic";

interface TalisBooksLibraryPageProps {
  searchParams: Promise<{
    accountType?: string;
    fastCode?: string;
  }>;
}

export default async function TalisBooksLibraryPage({
  searchParams,
}: TalisBooksLibraryPageProps) {
  const params = await searchParams;
  const fastCode = params.fastCode?.trim() || null;
  if (fastCode) {
    redirect(
      `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(fastCode.toLowerCase())}`,
    );
  }
  const accountType = params.accountType === "derivative" ? "derivative" : "root";
  const bookshelf = await getTalisBooksBookshelf({
    accountType,
    fastCode,
  });

  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
