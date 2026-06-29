import type { MapSiteSummaryData } from "@/lib/mapsite-layout";
import { MapPin } from "lucide-react";

interface MapSitePropertySummaryProps {
  summary: MapSiteSummaryData;
}

function formatLocation(summary: MapSiteSummaryData): string {
  return [summary.address, summary.city, summary.province, summary.postalCode, summary.country]
    .filter(Boolean)
    .join(", ");
}

export default function MapSitePropertySummary({
  summary,
}: MapSitePropertySummaryProps) {
  const location = formatLocation(summary);
  const hasContent =
    summary.description ||
    summary.price ||
    location ||
    summary.website ||
    summary.phone ||
    summary.email;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Property Summary
          </h2>

          {summary.price && (
            <p className="text-2xl font-semibold text-neutral-900 mb-4">
              {summary.price}
            </p>
          )}

          {summary.description && (
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-5">
              {summary.description}
            </p>
          )}

          <dl className="space-y-3 text-sm">
            {location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <dd className="text-neutral-700">{location}</dd>
              </div>
            )}
            {summary.phone && (
              <div className="flex flex-col sm:flex-row sm:gap-3">
                <dt className="text-neutral-400 sm:w-24 flex-shrink-0">Phone</dt>
                <dd className="text-neutral-700">{summary.phone}</dd>
              </div>
            )}
            {summary.email && (
              <div className="flex flex-col sm:flex-row sm:gap-3">
                <dt className="text-neutral-400 sm:w-24 flex-shrink-0">Email</dt>
                <dd className="text-neutral-700 break-all">{summary.email}</dd>
              </div>
            )}
            {summary.website && (
              <div className="flex flex-col sm:flex-row sm:gap-3">
                <dt className="text-neutral-400 sm:w-24 flex-shrink-0">Website</dt>
                <dd>
                  <a
                    href={summary.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 underline underline-offset-2 break-all"
                  >
                    {summary.website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
