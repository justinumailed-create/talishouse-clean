import { TALISU_AUDIO } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import { TALISU_DEEP_DIVE_TRANSCRIPT } from "@/lib/talisu/transcript";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Audio Deep Dive",
  description:
    "A deep dive on asset fractionalization and tokenization — listen or read the transcript.",
  path: "/talisu/au",
});

export default function TalisUAudioPage() {
  return (
    <SectionShell title={TALISU_AUDIO.title} subtitle={TALISU_AUDIO.playHint}>
      <div className={`mb-10 ${TALISU_CARD}`}>
        <h2 className="text-center text-lg font-semibold text-neutral-950 sm:text-xl">
          {TALISU_AUDIO.subtitle}
        </h2>
        <audio
          className="mt-6 w-full"
          controls
          preload="none"
          src={TALISU_AUDIO.deepDiveRemoteSrc}
        >
          Your browser does not support the audio element.
        </audio>
        <p className="mt-3 text-center text-xs text-neutral-500">
          Audio streams from the legacy host until Deep-Dive.mp3 (~40MB) is
          mirrored under public/talisu for production.
        </p>
      </div>

      <article className={`${TALISU_CARD} px-5 py-8 sm:px-8`}>
        <h2 className="mb-6 text-center text-xl font-semibold text-neutral-950">
          Transcript
        </h2>
        <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
          {TALISU_DEEP_DIVE_TRANSCRIPT.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>
    </SectionShell>
  );
}
