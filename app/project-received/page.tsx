import Link from "next/link";

export default function ProjectReceivedPage() {
  return (
    <div className="min-h-[70vh] bg-white py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            THANK YOU
          </h1>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em]">
              PROJECT RECEIVED
            </p>
            <Link
              href="/"
              className="text-xl leading-none text-white/70 transition hover:text-white"
              aria-label="Close"
            >
              ×
            </Link>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-base leading-relaxed text-gray-600">
                Thank you for referring a project. A team member will follow up within two business days.
              </p>
            </div>

            <Link
              href="/"
              className="w-full bg-[#1279c9] text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.28em] hover:bg-[#0f6bb1] transition-colors text-center block"
            >
              Return Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
