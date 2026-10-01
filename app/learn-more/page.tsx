import type { Metadata } from "next";
import Link from "next/link";
import { TALISU_BTN_PRIMARY, TALISU_CARD } from "@/lib/talisu/ui";

export const metadata: Metadata = {
  title: "Learn More | Tokenization — Talispros™",
  description:
    "Explore Tokenization with the Talisbooks™ E-Book experience and TalisU™ Audio.",
  alternates: { canonical: "/learn-more" },
  robots: { index: true, follow: true },
};

/**
 * Tokenization Learn More — 50/50 split entry to E-Book and Audio.
 * Reached from the homepage Tokenization ownership popover.
 */
export default function LearnMorePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-5 sm:py-10">
      <header className="mb-6 text-center sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#046BD9]">
          Tokenization
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          Learn More
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
          Dig deeper with the Talisbooks™ E-Book or listen to the TalisU™ Audio
          briefing on digital property fractionalization.
        </p>
      </header>

      <div className="grid min-h-[min(52vh,28rem)] flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <section
          className={`${TALISU_CARD} flex flex-col justify-between bg-gradient-to-br from-white to-[#f3f7fc]`}
          aria-labelledby="learn-more-ebook-title"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Left · Reading
            </p>
            <h2
              id="learn-more-ebook-title"
              className="mt-2 text-2xl font-semibold text-neutral-950"
            >
              E-Book
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-[15px]">
              Open the interactive Talisbooks™ bookshelf experience — property
              ownership models, market context, and Tokenization in print-ready
              form.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/talisu/eb" className={TALISU_BTN_PRIMARY}>
              Open E-Book
            </Link>
            <p className="mt-3 text-xs text-neutral-500">
              Continues to{" "}
              <span className="font-medium text-neutral-700">
                /catalogue/bookshelf
              </span>
            </p>
          </div>
        </section>

        <section
          className={`${TALISU_CARD} flex flex-col justify-between bg-gradient-to-br from-white to-[#f5f5f5]`}
          aria-labelledby="learn-more-audio-title"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Right · Listening
            </p>
            <h2
              id="learn-more-audio-title"
              className="mt-2 text-2xl font-semibold text-neutral-950"
            >
              Audio
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-[15px]">
              Hear Aisha &amp; Webster on digital property fractionalization —
              with full transcript on the TalisU™ Audio page.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/talisu/au" className={TALISU_BTN_PRIMARY}>
              Open Audio
            </Link>
            <p className="mt-3 text-xs text-neutral-500">
              Continues to{" "}
              <span className="font-medium text-neutral-700">/talisu/au</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
