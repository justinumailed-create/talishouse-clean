"use client";

import dynamic from "next/dynamic";
import type { TalisBooksViewerPage } from "@/lib/talisbooks/viewer";

const TalisMapsEmbed = dynamic(() => import("@/components/talismaps/TalisMapsEmbed"), {
  ssr: false,
  loading: () => (
    <div className="talisbooks-viewer-page__maps-loading" aria-hidden="true" />
  ),
});

export default function TalisBooksMapsPageView({ page }: { page: TalisBooksViewerPage }) {
  const hasCoords =
    page.latitude != null &&
    page.longitude != null &&
    Number.isFinite(page.latitude) &&
    Number.isFinite(page.longitude);

  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--maps">
      <div className="talisbooks-viewer-page__maps-stage">
        <TalisMapsEmbed
          latitude={hasCoords ? page.latitude : undefined}
          longitude={hasCoords ? page.longitude : undefined}
          zoom={page.mapZoom ?? 14}
          pinLabel={page.title || page.address || "Property location"}
          className="h-full w-full"
          minHeightClassName="min-h-0"
          emptyMessage="Add coordinates to display this property on Talismaps™."
        />
      </div>

      <div className="talisbooks-viewer-page__maps-caption">
        <p className="talisbooks-viewer-page__eyebrow">Mapsite™ · Talismaps™</p>
        {page.title ? (
          <h2 className="talisbooks-viewer-page__title">{page.title}</h2>
        ) : null}
        {page.address ? (
          <p className="talisbooks-viewer-page__maps-address">{page.address}</p>
        ) : null}
        {hasCoords ? (
          <p className="talisbooks-viewer-page__maps-coords">
            {page.latitude!.toFixed(6)}, {page.longitude!.toFixed(6)}
          </p>
        ) : null}
        {page.body ? (
          <p className="talisbooks-viewer-page__body-text">{page.body}</p>
        ) : null}
      </div>
    </div>
  );
}
