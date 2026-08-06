import Link from "next/link";

export default function MapSiteNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-16">
      <div className="text-center max-w-md">
        <p className="text-6xl font-semibold text-neutral-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Mapsite™ Not Found
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          No Mapsite™ exists for this FAST Code.
        </p>
        <Link
          href="/talispros"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Back to Talispros™
        </Link>
      </div>
    </div>
  );
}
