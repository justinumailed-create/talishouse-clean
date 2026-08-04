"use client";

import Link from "next/link";
import type { RegistrationMarket } from "@/lib/registration-market";

interface MapSiteOnboardingEntryProps {
  audience: RegistrationMarket;
}

export default function MapSiteOnboardingEntry({
  audience,
}: MapSiteOnboardingEntryProps) {
  const buildYourOwnHref = `/talispros/markets/claim-a-market?audience=${encodeURIComponent(
    audience
  )}`;
  const haveItBuiltHref = `/talispros/build-mapsite/assisted?audience=${encodeURIComponent(
    audience
  )}&setup=assisted&sourceAudience=${encodeURIComponent(
    audience
  )}`;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-white px-4 py-6 sm:px-5 sm:py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.08)] sm:p-9">
        <h1 className="text-center text-[28px] font-semibold tracking-tight text-neutral-900 sm:text-[38px]">
          Please Choose Your Initiation Path
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-neutral-600 sm:text-base">
          No obligation - free of charge
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            href={buildYourOwnHref}
            className="inline-flex min-h-[76px] items-center justify-center rounded-2xl bg-neutral-900 px-5 py-4 text-center text-base font-semibold tracking-[0.02em] text-white transition hover:bg-neutral-800"
          >
            Build My Mapsite™
          </Link>
          <Link
            href={haveItBuiltHref}
            className="inline-flex min-h-[76px] items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-center text-base font-semibold tracking-[0.02em] text-neutral-900 transition hover:bg-neutral-50"
          >
            Have It Built For Me
          </Link>
        </div>

        <p className="mx-auto mt-5 max-w-xl text-center text-[0.8125rem] leading-relaxed text-neutral-700 sm:text-[0.9rem]">
          Differentiate locally and develop a real estate adjacent marketing platform by using Mapsites™ to promote inventory in up to 10 categories with 100 pins and 1,000 views monthly, combined.*
        </p>
        <p className="mt-2 text-center text-xs leading-relaxed text-neutral-500 sm:text-sm">
          * Some limitations apply.
        </p>
      </div>
    </div>
  );
}
