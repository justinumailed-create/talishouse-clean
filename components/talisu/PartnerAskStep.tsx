import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { TALISU_BTN_PRIMARY, TALISU_CARD } from "@/lib/talisu/ui";

/**
 * "Ask for the business" step shown before Register (Aisha) and before the
 * Engage down payment (Webster): partner photo + write-up, one ask line, and
 * a primary Proceed link (same tab). The visitor must click Proceed.
 */
export default function PartnerAskStep({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  heading,
  name,
  askHeading,
  askLine,
  proceedLabel,
  proceedHref,
  children,
  testId,
}: {
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  heading: string;
  name: string;
  askHeading: string;
  askLine: string;
  proceedLabel: string;
  proceedHref: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-3xl" data-testid={testId}>
      <div className={TALISU_CARD}>
        <div className="grid items-start gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="flex justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className="h-auto w-full max-w-[200px] rounded-xl object-cover shadow-sm"
              sizes="200px"
              priority
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[#0069CF]">{heading}</h2>
            <p className="mt-2 text-sm font-medium text-neutral-950">{name}</p>
            <div className="mt-3 text-sm text-neutral-700">{children}</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#0069CF]/20 bg-[#0069CF]/5 px-4 py-4 text-center sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0069CF]">
            {askHeading}
          </p>
          <p
            className="mt-2 text-base font-semibold text-neutral-950 sm:text-lg"
            data-testid="partner-ask-line"
          >
            {askLine}
          </p>
          <Link
            href={proceedHref}
            className={`${TALISU_BTN_PRIMARY} mt-4 min-w-[10rem] px-8 py-3 text-base`}
            data-testid="partner-ask-proceed"
          >
            {proceedLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
