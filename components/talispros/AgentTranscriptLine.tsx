import { transcriptParts } from "@/lib/talispros/transcript-brand";

/** Shown text of an agent line. The audio keeps the original words. */
export default function AgentTranscriptLine({ text }: { text: string }) {
  return transcriptParts(text).map((part, index) =>
    part.kind === "link" ? (
      <a
        key={index}
        href="https://tsplits.com"
        className="guide-site-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        tsplits.com
      </a>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}
