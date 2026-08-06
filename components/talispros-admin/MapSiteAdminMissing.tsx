import Link from "next/link";

export default function MapSiteAdminMissing({
  fastCode,
  dbError,
}: {
  fastCode: string;
  dbError?: string | null;
}) {
  return (
    <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">
        Mapsite™ not found
      </h1>
      <p className="text-sm text-neutral-600 mb-4">
        No Mapsite™ exists for FAST code{" "}
        <span className="font-mono font-medium">{fastCode}</span>.
      </p>
      {dbError ? (
        <p className="text-sm text-red-600 mb-4 rounded-lg bg-red-50 px-3 py-2">
          Database error: {dbError}
        </p>
      ) : null}
      <p className="text-sm text-neutral-600 mb-6">
        If this is a new environment, apply pending Supabase migrations (including{" "}
        <code className="text-xs">052_seed_mapsite_lrg1.sql</code>) with{" "}
        <code className="text-xs">npx supabase db push --include-all</code>.
      </p>
      <Link
        href="/talispros/admin"
        className="inline-flex h-10 items-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Back to admin overview
      </Link>
    </div>
  );
}
