import {
  collectTranscriptSpeakers,
  parseTranscriptLine,
  speakerLabelColor,
  TALISU_SPEAKER_LABEL_CLASS,
} from "@/lib/talisu/speaker-colors";

type TranscriptLinesProps = {
  lines: readonly string[];
  className?: string;
  paragraphClassName?: string;
};

/**
 * Renders speaker-labeled transcript paragraphs with identifier colours
 * on the speaker name spans (Aisha orange, Webster/Ralf blue, etc.).
 */
export default function TranscriptLines({
  lines,
  className = "mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-neutral-700 sm:text-base",
  paragraphClassName,
}: TranscriptLinesProps) {
  const present = collectTranscriptSpeakers(lines);

  return (
    <div className={className}>
      {lines.map((line, i) => {
        const { speaker, text } = parseTranscriptLine(line);
        if (!speaker) {
          return (
            <p key={i} className={paragraphClassName}>
              {text}
            </p>
          );
        }
        const color = speakerLabelColor(speaker, present);
        return (
          <p key={i} className={paragraphClassName}>
            <span
              className={TALISU_SPEAKER_LABEL_CLASS}
              style={{ color }}
              data-speaker={speaker}
            >
              {speaker}:
            </span>{" "}
            {text}
          </p>
        );
      })}
    </div>
  );
}
