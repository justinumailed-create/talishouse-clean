import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: `Library | ${TALISBOOKS_PRODUCT_NAME}`,
  description:
    "Personal TalisBooks™ bookshelf for Root and Derivative accounts — search, sort, and filter published lookbooks.",
  path: "/talisbooks/library",
  private: true,
});

export const dynamic = "force-dynamic";

interface TalisBooksLibraryPageProps {
  searchParams: Promise<{
    accountType?: string;
  }>;
}

export default async function TalisBooksLibraryPage({
  searchParams,
}: TalisBooksLibraryPageProps) {
  const params = await searchParams;
  const accountType = params.accountType === "derivative" ? "derivative" : "root";
  const bookshelf = await getTalisBooksBookshelf({ accountType });

  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
