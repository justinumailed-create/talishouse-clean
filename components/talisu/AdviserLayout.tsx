import Image from "next/image";
import type { ReactNode } from "react";

/** Shared metal finish of the structure tabs (same as the home page picker). */
export const ADVISER_METAL_BG = [
  "linear-gradient(155deg, #f4f4f4 0%, #d8d8d8 16%, #a8a8a8 38%, #ececec 52%, #b5b5b5 72%, #cfcfcf 88%, #9e9e9e 100%)",
  "repeating-linear-gradient(95deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 1px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 3px)",
].join(", ");

/**
 * Adviser layout for the team-leader pages (Aisha on /talisu/reg, Thorsten P
 * on /talisu/engage): full-height portrait on the left half, kicker +
 * headline + the page's own controls on the right half, beige working-page
 * surface. On phones the portrait becomes a short band above the text.
 *
 * Text uses divs (not p) so the global unlayered `p` colours/margins do not
 * override the utility classes.
 */
export default function AdviserLayout({
  testId,
  imageSrc,
  imageAlt,
  imagePosition = "center 22%",
  kicker,
  title,
  children,
}: {
  testId: string;
  imageSrc: string;
  imageAlt: string;
  /** CSS object-position for the portrait crop. */
  imagePosition?: string;
  kicker: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className="talis-working-bg talis-adviser flex flex-col text-neutral-950 antialiased"
      data-testid={testId}
    >
      <article className="talis-adviser__grid mx-auto grid w-full max-w-[1400px] flex-1 lg:grid-cols-2">
        <div
          className="talis-adviser__photo relative shrink-0 overflow-hidden bg-[#2a2a2a]"
          data-testid={`${testId}-photo`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 700px, 100vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-start px-5 pb-8 pt-4 sm:px-10 sm:pb-10 sm:pt-6 lg:justify-center lg:py-8">
          <div
            className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-600 sm:text-[13px]"
            data-testid={`${testId}-kicker`}
          >
            {kicker}
          </div>
          <h1
            className="mt-2 mb-0! text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-neutral-950! sm:mt-3 sm:text-[28px] sm:leading-[1.25]"
            style={{ textWrap: "pretty" }}
          >
            {title}
          </h1>
          {children}
        </div>
      </article>
    </div>
  );
}
