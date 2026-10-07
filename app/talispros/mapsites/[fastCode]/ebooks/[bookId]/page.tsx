import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import OwnerEbookEditor from "@/components/talispros/ebook-editor/OwnerEbookEditor";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { loadOwnerEbook } from "@/lib/talisbooks/owner-ebook-editor";
import { safeMapSiteBackHref } from "@/lib/talispros/owner-ebook-routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ebook Editor · Talispros™",
  robots: { index: false, follow: false },
};

export default async function OwnerEbookEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ fastCode: string; bookId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { fastCode, bookId } = await params;
  const query = await searchParams;
  // Owner (paid) or Mapsite admin only — same gate as PIN Dashboard actions.
  if (!(await canEditMapSite(fastCode))) {
    redirect(CLIENT_LOGIN_PATH);
  }

  const { mapsite } = await getMapSiteByFastCodeResult(fastCode);
  if (!mapsite) notFound();

  const loaded = await loadOwnerEbook(fastCode, decodeURIComponent(bookId));
  if (!loaded.success) notFound();

  const back = Array.isArray(query.back) ? query.back[0] : query.back;
  const backHref = safeMapSiteBackHref(back, {
    fastCode: mapsite.fastCode,
    accountType: mapsite.accountType,
  });

  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      <OwnerEbookEditor
        fastCode={mapsite.fastCode.toLowerCase()}
        mapsiteId={mapsite.id}
        backHref={backHref}
        initialBook={loaded.book}
        initialPages={loaded.pages}
      />
    </div>
  );
}
