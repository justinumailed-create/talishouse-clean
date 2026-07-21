"use client";

import { MapPin, Navigation, X } from "lucide-react";
import type { NearbyListing } from "@/lib/mapsite/visitor-location";
import {
  formatDistanceKm,
  formatDrivingTime,
} from "@/lib/mapsite/visitor-location";

interface MapSiteVisitorLocationOverlayProps {
  showLocationNotice: boolean;
  onDismissNotice: () => void;
  nearbyListings: NearbyListing[];
  hasVisitorLocation: boolean;
}

export default function MapSiteVisitorLocationOverlay({
  showLocationNotice,
  onDismissNotice,
  nearbyListings,
  hasVisitorLocation,
}: MapSiteVisitorLocationOverlayProps) {
  return (
    <>
      {hasVisitorLocation ? (
        <div className="pointer-events-none absolute left-4 top-4 z-[500]">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm backdrop-blur">
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Your Location
          </div>
        </div>
      ) : null}

      {nearbyListings.length > 0 ? (
        <div className="pointer-events-auto absolute right-4 top-4 z-[500] w-[min(100%,18rem)]">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
            <div className="border-b border-neutral-100 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Nearby properties
              </p>
            </div>
            <ul className="max-h-52 overflow-y-auto">
              {nearbyListings.map((listing) => (
                <li
                  key={listing.pin.id}
                  className="border-b border-neutral-100 px-3 py-2.5 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-400"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {listing.pin.name}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDistanceKm(listing.distanceFromVisitor)} ·{" "}
                        {formatDrivingTime(listing.estimatedDrivingTime)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {showLocationNotice ? (
        <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-[500]">
          <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/95 px-4 py-3 text-sm text-neutral-600 shadow-md backdrop-blur">
            <Navigation
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400"
              aria-hidden
            />
            <p className="flex-1 leading-relaxed">
              Enable location in your browser to discover nearby properties on
              this map. Your coordinates are not saved.
            </p>
            <button
              type="button"
              onClick={onDismissNotice}
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="Dismiss location notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
