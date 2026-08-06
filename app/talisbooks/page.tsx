import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { TALISBOOKS_FUTURE_FEATURES, TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export default function TalisBooksMarketingPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Talispros™ Ecosystem
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {TALISBOOKS_PRODUCT_NAME}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-500 sm:text-xl">
            The native digital book engine for lookbooks, property stories, and branded
            publications — with templates, layouts, and publish workflows built in.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={TALISBOOKS_ROUTES.DASHBOARD}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={TALISBOOKS_ROUTES.VIEWER}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              <BookOpen className="h-4 w-4" />
              Open Viewer
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-[#f5f5f7]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="mb-10 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-neutral-500" />
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Platform Roadmap
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TALISBOOKS_FUTURE_FEATURES.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-neutral-200/80 bg-white px-5 py-4 text-sm font-medium text-neutral-700 shadow-sm"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Built for the Talispros™ ecosystem
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Talisbooks™ is a standalone digital publication engine for the Talispros™ ecosystem —
            books, pages, templates, and publish workflows linked to Mapsites™, accounts, and FAST Codes.
          </p>
          <Link
            href="/talispros"
            className="mt-6 inline-flex text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Return to Talispros™
          </Link>
        </div>
      </section>
    </div>
  );
}
