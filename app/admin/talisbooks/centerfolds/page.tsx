import Link from "next/link";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { listCenterfoldPreviews } from "@/lib/talisbooks/centerfold-service";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import TalisBooksCenterfoldPreviewList from "@/components/talisbooks/centerfold/TalisBooksCenterfoldPreviewList";

export const dynamic = "force-dynamic";

export default async function TalisBooksCenterfoldsAdminPage() {
  await requireTalisprosAdminPage();
  const previews = await listCenterfoldPreviews();
  const pending = previews.filter((p) => p.reviewStatus === "pending_preview");

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {TALISBOOKS_PRODUCT_NAME} · Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
              Centerfold preview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Landscape uploads that exceed the preferred page ratio are split into left and right
              pages. Review derived assets here before publishing — originals are never cropped.
            </p>
          </div>
          <Link
            href={TALISBOOKS_ROUTES.ADMIN}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            Back to admin
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Pending preview</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{pending.length}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Approved</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">
              {previews.filter((p) => p.reviewStatus === "approved").length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total centerfolds</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{previews.length}</p>
          </div>
        </div>

        {previews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">No centerfolds yet</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Upload landscape images wider than the preferred page ratio to generate left/right
              derived pages automatically.
            </p>
          </div>
        ) : (
          <TalisBooksCenterfoldPreviewList previews={previews} />
        )}
      </div>
    </div>
  );
}
