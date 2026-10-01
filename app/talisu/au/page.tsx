import { TALISU_AUDIO } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUAudioLibrary from "@/components/talisu/TalisUAudioLibrary";
import { TALISU_AISHA_WEBSTER_TRANSCRIPT } from "@/lib/talisu/transcript";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Audio",
  description:
    "Listen to TalisU™ audio — a short welcome autoplays, plus Aisha & Webster on digital property fractionalization.",
  path: "/talisu/au",
});

export default function TalisUAudioPage() {
  return (
    <SectionShell title={TALISU_AUDIO.title} subtitle={TALISU_AUDIO.playHint}>
      <TalisUAudioLibrary />

      <article className={`mt-10 ${TALISU_CARD} px-5 py-8 sm:px-8`}>
        <h2 className="mb-6 text-center text-xl font-semibold text-neutral-950">
          Transcript — Aisha &amp; Webster
        </h2>
        <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
          {TALISU_AISHA_WEBSTER_TRANSCRIPT.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>
    </SectionShell>
  );
}
