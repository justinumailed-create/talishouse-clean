import type { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Build Demo eBook and Mapsite™",
  description:
    "Place a demonstration pin and attach the pinned Talispros eBook. No FAST Code is issued.",
  path: DEMO_MAPSITE_BUILD_PATH,
});

export default function DemoMapSiteBuilderPage() {
  return (
    <div className="min-h-dvh bg-white px-5 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Demonstration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Build Demo eBook and Mapsite™
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Place a pin the same way as a live Mapsite™. We attach the sample
          Talispros eBook and skip FAST Code issuance.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href={`${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`}
            className="text-neutral-700 underline underline-offset-2"
          >
            Back to Talispros eBook
          </Link>
        </p>
        <div className="mt-8">
          <DemoMapSiteBuilderClient />
        </div>
      </div>
    </div>
  );
}
