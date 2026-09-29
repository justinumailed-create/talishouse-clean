import { TALISU_AUDIO } from "@/lib/talisu/content";
import { TALISU_DEEP_DIVE_TRANSCRIPT } from "@/lib/talisu/transcript";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Audio Deep Dive",
  description:
    "A deep dive on asset fractionalization and tokenization — listen or read the transcript.",
  path: "/talisu/au",
});

export default function TalisUAudioPage() {
  return (
    <SectionShell
      title={TALISU_AUDIO.title}
      subtitle={TALISU_AUDIO.playHint}
    >
      <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 sm:p-8">
        <h2 className="text-center text-lg font-semibold text-amber-200 sm:text-xl">
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
        <p className="mt-3 text-center text-xs text-white/40">
          Audio streams from the legacy host until Deep-Dive.mp3 (~40MB) is
          mirrored under public/talisu for production.
        </p>
      </div>

      <article className="rounded-2xl border border-white/10 bg-white px-5 py-8 text-neutral-900 sm:px-8 print:border-0 print:shadow-none">
        <h2 className="mb-6 text-center text-xl font-semibold">
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
