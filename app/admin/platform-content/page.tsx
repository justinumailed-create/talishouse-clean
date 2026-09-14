import Link from "next/link";
import { requireAdminScopePage } from "@/lib/admin-auth";
import {
  MARKETING_ADMIN_DEMOS_PATH,
  MARKETING_ADMIN_PATH,
  MARKETING_HOME_PATH,
} from "@/lib/mapsite-account-session";
import MarketingAdminQueue from "@/app/talispros/marketing/admin/MarketingAdminQueue";

export const dynamic = "force-dynamic";

export default async function AdminPlatformContentPage() {
  await requireAdminScopePage("platform-content");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Platform Content</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Marketing and platform copy, images, demo listings, and promotional
          content. This is the existing Marketing Admin — not the thin homepage
          hero-title editor.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href={MARKETING_ADMIN_PATH}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Marketing Admin</p>
          <p className="mt-1 text-xs text-neutral-500">
            Registrations, listing text, images, and Mapsite™ handoff.
          </p>
        </Link>
        <Link
          href={MARKETING_ADMIN_DEMOS_PATH}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Demo Mapsites™</p>
          <p className="mt-1 text-xs text-neutral-500">
            Edit or remove demonstration listings and promotional Mapsites™.
          </p>
        </Link>
        <Link
          href={MARKETING_HOME_PATH}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Marketing clients</p>
          <p className="mt-1 text-xs text-neutral-500">
            Client metrics, campaign notes, and daily marketing updates.
          </p>
        </Link>
        <Link
          href="/admin/content"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Global hero titles</p>
          <p className="mt-1 text-xs text-neutral-500">
            Talishouse homepage GlobalContent strings only.
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Product images</p>
          <p className="mt-1 text-xs text-neutral-500">
            Promotional product photos used on public catalog pages.
          </p>
        </Link>
        <Link
          href="/admin/mapsites"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Mapsite™ listings</p>
          <p className="mt-1 text-xs text-neutral-500">
            Listing write-ups, gallery images, pins, and linked Talisbooks™.
          </p>
        </Link>
      </section>

      <MarketingAdminQueue />
    </div>
  );
}
