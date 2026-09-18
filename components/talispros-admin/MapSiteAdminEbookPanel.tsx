"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import EbookGenerateClient from "@/components/talispros/EbookGenerateClient";
import { ROUTES } from "@/lib/routes";
import type { MapSiteEbookDraft } from "@/lib/talisbooks/mapsite-ebook-service";

interface MapSiteAdminEbookPanelProps {
  fastCode: string;
  mapsiteId: string;
  requestId?: string | null;
  accountType?: string | null;
  initialEbook: MapSiteEbookDraft | null;
  adminWritesEnabled?: boolean;
  initialAgentName?: string;
  initialAgentEmail?: string;
  initialAgentPhone?: string;
  pinLatitude?: number | null;
  pinLongitude?: number | null;
  initialPropertyAddress?: string | null;
  initialListingTitle?: string | null;
  initialPinWriteup?: string | null;
  initialPriceLine?: string | null;
  initialAgencyLogoUrl?: string | null;
}

export default function MapSiteAdminEbookPanel({
  fastCode,
  mapsiteId,
  requestId = null,
  accountType = null,
  initialEbook,
  adminWritesEnabled = true,
  initialAgentName = "",
  initialAgentEmail = "",
  initialAgentPhone = "",
  pinLatitude = null,
  pinLongitude = null,
  initialPropertyAddress = null,
  initialListingTitle = null,
  initialPinWriteup = null,
  initialPriceLine = null,
  initialAgencyLogoUrl = null,
}: MapSiteAdminEbookPanelProps) {
  const router = useRouter();
  const [editExisting, setEditExisting] = useState(Boolean(initialEbook));
  const shelfHref = `${ROUTES.TALISBOOKS_LIBRARY}?fastCode=${encodeURIComponent(fastCode)}`;
  const viewerHref = initialEbook
    ? `${ROUTES.TALISBOOKS_VIEWER}/${initialEbook.slug}`
    : null;
  const replaceBookId =
    editExisting && initialEbook ? initialEbook.id : null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Custom ebook editor
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {replaceBookId
              ? `Edit the existing Talisbook™ with the same template slots used on Build — then update ${fastCode.toUpperCase()}.`
              : `Same Talisbook™ template builder used when generating a book from the
            Build pages — upload a wrap PDF or images, or fill the template slots,
            then generate for ${fastCode.toUpperCase()}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={shelfHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50"
          >
            Open shelf <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {viewerHref ? (
            <Link
              href={viewerHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50"
            >
              Preview book <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      {initialEbook ? (
        <div
          role="radiogroup"
          aria-label="Ebook editor mode"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={editExisting}
            onClick={() => setEditExisting(true)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
              editExisting
                ? "bg-neutral-950 text-white ring-neutral-950"
                : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            Edit existing
          </button>
          <button
            type="button"
            aria-pressed={!editExisting}
            onClick={() => setEditExisting(false)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
              !editExisting
                ? "bg-neutral-950 text-white ring-neutral-950"
                : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            Create another
          </button>
        </div>
      ) : null}

      {!adminWritesEnabled ? (
        <p className="text-sm text-neutral-500">
          Ebook writes are disabled for this session.
        </p>
      ) : (
        <EbookGenerateClient
          key={replaceBookId || "new-ebook"}
          embedded
          requestId={requestId}
          fastCode={fastCode}
          mapsiteId={mapsiteId}
          accountType={accountType}
          replaceBookId={replaceBookId}
          initialRm22Hydration={
            replaceBookId ? initialEbook?.rm22Hydration ?? null : null
          }
          existingFrontCoverUrl={
            replaceBookId ? initialEbook?.coverImageUrl ?? null : null
          }
          existingBackCoverUrl={
            replaceBookId ? initialEbook?.backCoverImageUrl ?? null : null
          }
          existingInteriorUrls={
            replaceBookId ? initialEbook?.listingImageUrls ?? [] : []
          }
          initialAgencyLogoUrl={initialAgencyLogoUrl}
          initialAgentName={initialAgentName}
          initialAgentEmail={initialAgentEmail}
          initialAgentPhone={initialAgentPhone}
          pinLatitude={pinLatitude}
          pinLongitude={pinLongitude}
          initialPropertyAddress={initialPropertyAddress}
          initialListingTitle={initialListingTitle}
          initialPinWriteup={initialPinWriteup}
          initialPriceLine={initialPriceLine}
          onCompleted={() => router.refresh()}
        />
      )}
    </section>
  );
}
