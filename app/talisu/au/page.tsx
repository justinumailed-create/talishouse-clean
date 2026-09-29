import { TALISU_AUDIO } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import { TALISU_AISHA_WEBSTER_TRANSCRIPT } from "@/lib/talisu/transcript";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Audio",
  description:
    "Digital property fractionalization with Aisha & Webster — listen or read the transcript.",
  path: "/talisu/au",
});

export default function TalisUAudioPage() {
  return (
    <SectionShell title={TALISU_AUDIO.title} subtitle={TALISU_AUDIO.playHint}>
      <div className={`mb-10 ${TALISU_CARD}`}>
        <h2 className="text-center text-lg font-semibold text-neutral-950 sm:text-xl">
          {TALISU_AUDIO.aishaWebsterSubtitle}
        </h2>
        <audio
          className="mt-6 w-full"
          controls
          preload="metadata"
          src={TALISU_AUDIO.aishaWebsterSrc}
        >
          <track
            kind="captions"
            src={TALISU_AUDIO.aishaWebsterVtt}
            srcLang="en"
            label="English"
          />
          Your browser does not support the audio element.
        </audio>
      </div>

      <article className={`${TALISU_CARD} px-5 py-8 sm:px-8`}>
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
