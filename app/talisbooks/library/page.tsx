import { accountHasAdminScope } from "@/lib/admin-constants";
import { redirect } from "next/navigation";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import {
  getTalisBooksBookshelf,
  talisbooksScopeFromAdminAccount,
} from "@/lib/talisbooks/library";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import { ROUTES } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisbooks/library");
}

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
  const sessionAccount = await getAdminSessionAccount();
  // Agent Admins need the talisbooks privilege to manage library books.
  const account = accountHasAdminScope(sessionAccount, "talisbooks") ? sessionAccount : null;
  const scope = talisbooksScopeFromAdminAccount(account);
  const bookshelf = await getTalisBooksBookshelf({
    accountType,
    fastCode: scope.fastCode,
    excludeDemonstrationCatalog: scope.excludeDemonstrationCatalog,
  });

  return (
    <TalisBooksLibraryShell
      bookshelf={bookshelf}
      canDelete={Boolean(account)}
      backHref={mapsiteBackFromScheduleHref(params.from)}
    />
  );
}
