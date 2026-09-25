import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import IsolatedBookshelfCreateClient from "@/components/catalogue/IsolatedBookshelfCreateClient";
import {
  getAdminSessionAccount,
  requireAdminPage,
} from "@/lib/admin-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  ISOLATED_BOOKSHELF_DESTINATION,
  ISOLATED_BOOKSHELF_PATH,
} from "@/lib/talisbooks/isolated-bookshelf";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Create Isolated Shelf Book | T-All Catalogue",
  description:
    "Self-serve ebook flow for the admin-only T-All isolated bookshelf.",
  robots: { index: false, follow: false },
};

/**
 * Self-serve ebook entry for the isolated catalogue bookshelf.
 * Catalogue chrome "Bookshelf" lands here so reaching the shelf follows
 * the self-serve generate process — admin only.
 *
 * A linked Mapsite™ is optional: isolated create works with any admin FAST
 * Code (e.g. ADMIN123) even when no Mapsite™ exists for that code.
 */
export default async function CatalogueIsolatedBookshelfCreatePage() {
  await requireAdminPage();
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }

  const mapsite = await getMapSiteByFastCode(account.fastCode);

  return (
    <div
      className="min-h-dvh bg-[#f5f5f7]"
      data-testid="isolated-bookshelf-create"
    >
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Self-serve ebook
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
              Create for isolated bookshelf
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Admin self-serve ebook for the isolated T-All shelf. A linked
              Mapsite™ is optional — finished books are tagged for this shelf
              only, not the public /talisbooks catalogue.
            </p>
          </div>
          <Link
            href={ISOLATED_BOOKSHELF_PATH}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            View shelf
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <IsolatedBookshelfCreateClient
          fastCode={mapsite?.fastCode ?? account.fastCode}
          mapsiteId={mapsite?.id ?? null}
          accountType={mapsite?.accountType ?? "root"}
          agentName={mapsite?.agentName ?? account.name}
          agentEmail={mapsite?.email || account.email || ""}
          agentPhone={mapsite?.phone || ""}
          propertyAddress={mapsite?.propertyAddress ?? ""}
          listingTitle={mapsite?.propertyTitle ?? ""}
          destination={ISOLATED_BOOKSHELF_DESTINATION}
        />
      </main>
    </div>
  );
}
