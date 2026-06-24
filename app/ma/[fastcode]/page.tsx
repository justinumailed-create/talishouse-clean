import { getTalisMapsData } from "@/lib/talismaps";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ROOT_ACCOUNT: "Root Account™",
  DERIVATIVE_ACCOUNT: "Derivative Account™",
  ADPRO_SINGLE: "Single AdPro™ PIN",
  ADPRO_10: "Up To 10 AdPro™ PINs",
  ADPRO_100: "Up To 100 AdPro™ PINs",
  ADPRO_UNLIMITED: "Unlimited AdPro™ PINs",
};

function formatAccountType(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] || type;
}

export async function generateMetadata({ params }: { params: Promise<{ fastcode: string }> }): Promise<Metadata> {
  const { fastcode } = await params;
  const data = await getTalisMapsData(fastcode);
  if (data.notFound || !data.mapsite) {
    return { title: "MapSite Not Found | TalisMaps™" };
  }
  return {
    title: `MapSite ${data.mapsite.fastCode} | TalisMaps™`,
    description: `MapSite™ with FAST Code ${data.mapsite.fastCode}`,
  };
}

export default async function TalisMapsPage({ params }: { params: Promise<{ fastcode: string }> }) {
  const { fastcode } = await params;
  const data = await getTalisMapsData(fastcode);

  if (data.notFound || !data.mapsite) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">MapSite Not Found</h1>
          <p className="text-sm text-neutral-500">{data.message}</p>
        </div>
      </div>
    );
  }

  const ms = data.mapsite;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-2xl mx-auto px-5 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Welcome To Your MapSite™
          </h1>
          <p className="text-sm text-neutral-500 mt-2">Your TalisPros™ account is active and ready.</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm mb-8">
          <dl className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <dt className="text-xs text-neutral-400 uppercase tracking-wider font-medium">FAST Code</dt>
              <dd className="text-sm font-mono font-semibold text-neutral-900">{ms.fastCode}</dd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <dt className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Account Type</dt>
              <dd className="text-sm font-semibold text-neutral-900">{formatAccountType(ms.accountType)}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Status</dt>
              <dd className="text-sm font-semibold text-green-600">{ms.status.toUpperCase()}</dd>
            </div>
          </dl>

          <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-900">MapSite™ successfully created.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">TalisMaps™</h2>
          <div className="bg-neutral-50 rounded-xl border border-dashed border-neutral-300 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-1">TalisMaps™ Loading...</p>
            <p className="text-xs text-neutral-400">Future versions will display:</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400">
              <span>Property Pins</span>
              <span>AdPro™ Pins</span>
              <span>Categories</span>
              <span>Search</span>
              <span>Market Overlays</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
