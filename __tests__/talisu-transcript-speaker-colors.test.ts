import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectTranscriptSpeakers,
  parseTranscriptLine,
  speakerLabelColor,
  TALISU_SPEAKER_AISHA_COLOR,
  TALISU_SPEAKER_RALF_DISTINCT_COLOR,
  TALISU_SPEAKER_WEBSTER_COLOR,
} from "../lib/talisu/speaker-colors";
import { TALISU_AISHA_WEBSTER_TRANSCRIPT } from "../lib/talisu/transcript";

describe("TalisU transcript speaker colours", () => {
  it("parses Aisha / Thorsten P labeled lines", () => {
    const a = parseTranscriptLine("Aisha: Hello there.");
    expect(a.speaker).toBe("Aisha");
    expect(a.text).toBe("Hello there.");
    const w = parseTranscriptLine("Thorsten P: Completely locked up.");
    expect(w.speaker).toBe("Thorsten P");
  });

  it("labels the male speaker Thorsten P in the transcript (no Webster)", () => {
    expect(TALISU_AISHA_WEBSTER_TRANSCRIPT.some((l) => l.startsWith("Thorsten P: "))).toBe(true);
    expect(TALISU_AISHA_WEBSTER_TRANSCRIPT.join("\n")).not.toContain("Webster");
  });

  it("colours Aisha orange and Thorsten P blue", () => {
    const present = collectTranscriptSpeakers(TALISU_AISHA_WEBSTER_TRANSCRIPT);
    expect(speakerLabelColor("Aisha", present)).toBe(TALISU_SPEAKER_AISHA_COLOR);
    expect(speakerLabelColor("Thorsten P", present)).toBe(
      TALISU_SPEAKER_WEBSTER_COLOR,
    );
  });

  it("colours Ralf blue when Thorsten P is not also present", () => {
    const present = new Set(["Aisha", "Ralf"]);
    expect(speakerLabelColor("Ralf", present)).toBe(TALISU_SPEAKER_WEBSTER_COLOR);
  });

  it("colours Ralf distinctly when Thorsten P and Ralf both appear", () => {
    const present = new Set(["Aisha", "Thorsten P", "Ralf"]);
    expect(speakerLabelColor("Thorsten P", present)).toBe(
      TALISU_SPEAKER_WEBSTER_COLOR,
    );
    expect(speakerLabelColor("Ralf", present)).toBe(
      TALISU_SPEAKER_RALF_DISTINCT_COLOR,
    );
  });

  it("keeps TranscriptLines wired in the audio library (page shows TalisTV soon placeholder)", () => {
    const page = readFileSync(resolve("app/talisu/au/page.tsx"), "utf8");
    expect(page).toContain("TalisUTalisTvSoonPlaceholder");
    expect(page).not.toContain("TalisUAudioLibrary");

    const library = readFileSync(
      resolve("components/talisu/TalisUAudioLibrary.tsx"),
      "utf8",
    );
    expect(library).toContain("TranscriptLines");
    expect(library).toContain("TALISU_AUDIO_TRANSCRIPTS");

    const component = readFileSync(
      resolve("components/talisu/TranscriptLines.tsx"),
      "utf8",
    );
    expect(component).toContain("speakerLabelColor");
    expect(component).toContain("data-speaker");
  });
});
