import { getMapSiteByFastCode } from "@/lib/mapsite";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MapSite | TalisPros",
};

function PlaceholderIcon({ label }: { label: string }) {
  return (
    <div className="w-full aspect-[4/3] bg-neutral-100 rounded-xl flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xs text-neutral-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default async function MapSitePage({
  params,
}: {
  params: Promise<{ fastcode: string }>;
}) {
  const { fastcode } = await params;
  const result = await getMapSiteByFastCode(fastcode);

  if ("notFound" in result) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">
            MapSite Not Found
          </h1>
          <p className="text-sm text-neutral-500">{result.message}</p>
        </div>
      </div>
    );
  }

  const displayName = `${result.firstName} ${result.lastName}`.trim() || "Untitled";

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            TalisPros MapSite
          </span>
          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-semibold">
            {result.fastCode}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            {displayName}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {result.description || "No description provided"}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {result.mediaType}
            </span>
            <StatusBadge status={result.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <AssetCard
            label="Profile Image"
            url={result.profileImageUrl}
            placeholder="No profile image uploaded"
          />
          <AssetCard
            label="Logo"
            url={result.logoImageUrl}
            placeholder="No logo uploaded"
          />
          <AssetCard
            label="PIN Image"
            url={result.pinImageUrl}
            placeholder="No PIN image uploaded"
          />
          <AssetCard
            label="Monologue / Script"
            url={result.monologuePdfUrl}
            placeholder="No script uploaded"
            isPdf
          />
          <AssetCard
            label="E-Book"
            url={result.ebookPdfUrl}
            placeholder="No e-book uploaded"
            isPdf
          />
          <InfoCard
            label="Contact"
            lines={[
              { label: "Email", value: result.email },
              { label: "Phone", value: result.phone },
            ]}
          />
        </div>

        <div className="border border-dashed border-neutral-300 rounded-xl p-6 text-center">
          <p className="text-sm text-neutral-400">
            Full Atlas MapSite experience coming soon
          </p>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    ready_for_review: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function AssetCard({
  label,
  url,
  placeholder,
  isPdf,
}: {
  label: string;
  url: string | null;
  placeholder: string;
  isPdf?: boolean;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="p-1">
        {url ? (
          isPdf ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full aspect-[4/3] bg-neutral-50 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-red-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-neutral-500 font-medium">Open PDF</p>
              </div>
            </a>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-neutral-50 rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={label}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
            </div>
          )
        ) : (
          <PlaceholderIcon label={placeholder} />
        )}
      </div>
      <div className="px-3 pb-3">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  lines,
}: {
  label: string;
  lines: { label: string; value: string }[];
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.label}>
            <p className="text-[11px] text-neutral-400">{line.label}</p>
            <p className="text-sm text-neutral-900">{line.value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
