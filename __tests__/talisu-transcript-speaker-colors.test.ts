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
  it("parses Aisha / Webster labeled lines", () => {
    const a = parseTranscriptLine("Aisha: Hello there.");
    expect(a.speaker).toBe("Aisha");
    expect(a.text).toBe("Hello there.");
    const w = parseTranscriptLine("Webster: Completely locked up.");
    expect(w.speaker).toBe("Webster");
  });

  it("colours Aisha orange and Webster blue", () => {
    const present = collectTranscriptSpeakers(TALISU_AISHA_WEBSTER_TRANSCRIPT);
    expect(speakerLabelColor("Aisha", present)).toBe(TALISU_SPEAKER_AISHA_COLOR);
    expect(speakerLabelColor("Webster", present)).toBe(
      TALISU_SPEAKER_WEBSTER_COLOR,
    );
  });

  it("colours Ralf blue when Webster is not also present", () => {
    const present = new Set(["Aisha", "Ralf"]);
    expect(speakerLabelColor("Ralf", present)).toBe(TALISU_SPEAKER_WEBSTER_COLOR);
  });

  it("colours Ralf distinctly when Webster and Ralf both appear", () => {
    const present = new Set(["Aisha", "Webster", "Ralf"]);
    expect(speakerLabelColor("Webster", present)).toBe(
      TALISU_SPEAKER_WEBSTER_COLOR,
    );
    expect(speakerLabelColor("Ralf", present)).toBe(
      TALISU_SPEAKER_RALF_DISTINCT_COLOR,
    );
  });

  it("wires TranscriptLines into /talisu/au via the audio library", () => {
    const page = readFileSync(resolve("app/talisu/au/page.tsx"), "utf8");
    expect(page).toContain("TalisUAudioLibrary");

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
