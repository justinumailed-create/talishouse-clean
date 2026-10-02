import Link from "next/link";
import { TALISU_FAQ, TALISU_WELCOME } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import {
  TALISU_BTN_PRIMARY,
  TALISU_BTN_SECONDARY,
  TALISU_CARD,
} from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Welcome",
  description:
    "Transaction structures we support: Conventional, SPLITS, Fractionalization, and Tokenization — with an Aisha audio summary.",
  path: "/talisu",
});

export default function TalisUHomePage() {
  return (
    <SectionShell title="TalisU™" subtitle={TALISU_WELCOME.eyebrow}>
      <div className={`mb-10 ${TALISU_CARD}`}>
        <p className="text-center text-sm font-medium text-neutral-800">
          {TALISU_WELCOME.aishaTitle}
        </p>
        <p className="mt-1 text-center text-xs text-neutral-500">
          {TALISU_WELCOME.aishaArtist}
        </p>
        <audio
          className="mt-4 w-full"
          controls
          preload="metadata"
          src={TALISU_WELCOME.aishaSrc}
        >
          Your browser does not support the audio element.
        </audio>
      </div>

      <h2 className="mb-6 text-center text-xl font-semibold text-neutral-950 sm:text-2xl">
        {TALISU_WELCOME.heading}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {TALISU_WELCOME.structures.map((item) => (
          <article key={item.title} className={TALISU_CARD}>
            <h3 className="text-lg font-semibold text-[#0069CF]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <section id="faq" className="mt-14 scroll-mt-24" aria-labelledby="talisu-faq-heading">
        <h2
          id="talisu-faq-heading"
          className="mb-6 text-center text-xl font-semibold text-neutral-950 sm:text-2xl"
        >
          {TALISU_FAQ.title}
        </h2>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {TALISU_FAQ.items.map((item) => (
            <details
              key={item.question}
              className={`group ${TALISU_CARD} open:ring-[#046BD9]/25`}
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-[#0069CF] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{item.question}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-neutral-400 transition group-open:rotate-180"
                  >
                    ▾
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/talisu/mkts" className={TALISU_BTN_PRIMARY}>
          Markets
        </Link>
        <Link href="/talisu/au" className={TALISU_BTN_SECONDARY}>
          Audio
        </Link>
        <Link href="/talisu/reg" className={TALISU_BTN_SECONDARY}>
          Register
        </Link>
        <Link href="/talisu/bo" className={TALISU_BTN_SECONDARY}>
          Sea-Cans Business Office
        </Link>
      </div>
    </SectionShell>
  );
}
