import Link from "next/link";
import { TALISU_WELCOME } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Welcome",
  description:
    "Transaction structures we support: Conventional, SPLITS, Fractionalization, and Tokenization — with an Aisha audio summary.",
  path: "/talisu",
});

export default function TalisUHomePage() {
  return (
    <SectionShell
      title="TalisU™"
      subtitle={TALISU_WELCOME.eyebrow}
    >
      <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 sm:p-8">
        <p className="text-center text-sm font-medium text-amber-200/90">
          {TALISU_WELCOME.aishaTitle}
        </p>
        <p className="mt-1 text-center text-xs text-white/40">
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

      <h2 className="mb-6 text-center text-xl font-semibold text-white sm:text-2xl">
        {TALISU_WELCOME.heading}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {TALISU_WELCOME.structures.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <h3 className="text-lg font-semibold text-amber-200">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/talisu/mkts"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
        >
          Markets
        </Link>
        <Link
          href="/talisu/au"
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
        >
          Audio Deep Dive
        </Link>
        <Link
          href="/talisu/reg"
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
        >
          Register
        </Link>
        <Link
          href="/talisu/bo"
          className="rounded-full border border-amber-400/40 px-5 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-500/10"
        >
          Sea-Cans Business Office
        </Link>
      </div>
    </SectionShell>
  );
}
