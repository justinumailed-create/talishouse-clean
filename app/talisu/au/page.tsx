import { TALISU_AUDIO } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUAudioLibrary from "@/components/talisu/TalisUAudioLibrary";

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
    </SectionShell>
  );
}
