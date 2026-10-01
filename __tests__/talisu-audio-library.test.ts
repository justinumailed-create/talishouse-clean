import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TALISU_AUDIO, TALISU_AUDIO_LIBRARY } from "../lib/talisu/content";
import {
  TALISU_AISHA_SUMMARY_TRANSCRIPT,
  TALISU_AISHA_WEBSTER_TRANSCRIPT,
  TALISU_AUDIO_TRANSCRIPTS,
} from "../lib/talisu/transcript";

describe("TalisU Audio library", () => {
  it("autoplays the ~1 minute Aisha welcome clip and lists the rest like KB", () => {
    expect(TALISU_AUDIO.autoplaySrc).toBe("/talisu/Aisha.mp3");
    const autoplay = TALISU_AUDIO_LIBRARY.find((i) => i.autoplay);
    expect(autoplay?.src).toBe("/talisu/Aisha.mp3");
    expect(TALISU_AUDIO_LIBRARY.some((i) => i.src === "/talisu/Aisha-Webster.mp3")).toBe(
      true,
    );

    const page = readFileSync(resolve("app/talisu/au/page.tsx"), "utf8");
    expect(page).toContain("TalisUAudioLibrary");

    const lib = readFileSync(
      resolve("components/talisu/TalisUAudioLibrary.tsx"),
      "utf8",
    );
    expect(lib).toContain("autoPlay");
    expect(lib).toContain("TALISU_AUDIO_LIBRARY");
    expect(lib).toContain("Audios");
  });

  it("maps Aisha-labeled transcripts per library episode and swaps under the player", () => {
    expect(TALISU_AUDIO_TRANSCRIPTS["aisha-summary"]).toBe(
      TALISU_AISHA_SUMMARY_TRANSCRIPT,
    );
    expect(TALISU_AUDIO_TRANSCRIPTS["aisha-webster"]).toBe(
      TALISU_AISHA_WEBSTER_TRANSCRIPT,
    );
    expect(TALISU_AISHA_SUMMARY_TRANSCRIPT[0]).toMatch(/^Aisha:/);

    const lib = readFileSync(
      resolve("components/talisu/TalisUAudioLibrary.tsx"),
      "utf8",
    );
    expect(lib).toContain("TranscriptLines");
    expect(lib).toContain("TALISU_AUDIO_TRANSCRIPTS");
    expect(lib).toContain("userPickedRef");
    expect(lib).toContain("handleSelect");
  });
});
