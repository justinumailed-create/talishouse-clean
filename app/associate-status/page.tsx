import Link from "next/link";

export default function AssociateStatusPage() {
  return (
    <div className="min-h-[70vh] bg-white py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            Associate Status
          </h1>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em]">
              Associate Status
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
            <h2 className="text-lg font-bold text-gray-900">
              Become a Talishouse Associate
            </h2>

            <div className="space-y-4 text-gray-600">
              <p>
                Talishouse Associates help connect clients with our modular home
                solutions and earn referral fees for successful projects.
              </p>

              <h3 className="font-semibold text-gray-900 mt-6">
                Benefits of Associate Status:
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Earn referral fees on completed projects</li>
                <li>Access to exclusive product information</li>
                <li>Marketing and sales support</li>
                <li>Priority access to new product launches</li>
                <li>Dedicated account management</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-6">
                Requirements:
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Valid business registration (where applicable)</li>
                <li>Professional references</li>
                <li>Agreement to Talishouse Associate Terms</li>
                <li>Completed onboarding training</li>
              </ul>
            </div>

            <Link
              href="/subscription"
              className="w-full bg-black text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.28em] hover:bg-gray-900 transition-colors text-center block"
            >
              Apply for Associate Status
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
