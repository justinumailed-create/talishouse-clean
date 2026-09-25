import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { isTalisprosAdminAuthenticated } from "@/lib/talispros-admin-auth";
import {
  getTalisBooksBookshelf,
  talisbooksScopeFromAdminAccount,
} from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";
import {
  bookshelfOgMetadataImage,
} from "@/lib/talispros/mapsite-og-image";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = createMetadata({
  title: `Library | ${TALISBOOKS_PRODUCT_NAME}`,
  description:
    "Public Talisbooks™ bookshelf of created FAST-linked lookbooks — search, sort, and open covers in the viewer.",
  path: "/talisbooks/library",
  private: true,
  image: bookshelfOgMetadataImage(`Library | ${TALISBOOKS_PRODUCT_NAME}`),
});

export const dynamic = "force-dynamic";

interface TalisBooksLibraryPageProps {
  searchParams: Promise<{
    accountType?: string;
    fastCode?: string;
    from?: string;
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
  const [account, talisprosAdmin] = await Promise.all([
    getAdminSessionAccount(),
    isTalisprosAdminAuthenticated(),
  ]);
  const scope = talisbooksScopeFromAdminAccount(account);
  const bookshelf = await getTalisBooksBookshelf({
    accountType,
    fastCode: scope.fastCode,
    excludeDemonstrationCatalog: scope.excludeDemonstrationCatalog,
  });

  return (
    <TalisBooksLibraryShell
      bookshelf={bookshelf}
      canDelete={Boolean(account) || talisprosAdmin}
      backHref={mapsiteBackFromScheduleHref(params.from)}
    />
  );
}
