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
import { ROUTES } from "@/lib/routes";

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
 * the same generate process as Mapsite™ self-serve — admin only.
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
              Same generate flow as Talispros™ self-serve. The finished book is
              tagged for the isolated T-All shelf only — not the public
              /talisbooks catalogue.
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
        {!mapsite ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-950">
            <p className="font-semibold">
              No Mapsite™ linked to admin FAST Code{" "}
              {account.fastCode.toUpperCase()}
            </p>
            <p className="mt-2 text-amber-900/80">
              The self-serve ebook process needs a Mapsite™ for{" "}
              <span className="font-mono">{account.fastCode.toUpperCase()}</span>.
              Open Mapsites™ in Global Admin, then return here.
            </p>
            <Link
              href={ROUTES.ADMIN_MAPSITES}
              className="mt-4 inline-flex rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Open Mapsites™ admin
            </Link>
          </div>
        ) : (
          <IsolatedBookshelfCreateClient
            fastCode={mapsite.fastCode}
            mapsiteId={mapsite.id}
            accountType={mapsite.accountType ?? "root"}
            agentName={mapsite.agentName ?? account.name}
            agentEmail={mapsite.email || account.email || ""}
            agentPhone={mapsite.phone || ""}
            propertyAddress={mapsite.propertyAddress ?? ""}
            listingTitle={mapsite.propertyTitle ?? ""}
            destination={ISOLATED_BOOKSHELF_DESTINATION}
          />
        )}
      </main>
    </div>
  );
}
