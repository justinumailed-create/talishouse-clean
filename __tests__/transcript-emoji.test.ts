import { describe, expect, it } from "vitest";
import { transcriptParts } from "@/lib/talispros/transcript-brand";

const shown = (text: string) =>
  transcriptParts(text)
    .map((part) => (part.kind === "link" ? "tsplits.com" : part.text))
    .join("");

describe("agent transcript display", () => {
  it("hides emotion tags, with no emojis, including unknown or half-streamed tags", () => {
    expect(shown("[happy] We offer Mapsites.")).toBe("We offer Mapsites.");
    expect(shown("Sure [laughs] yes")).toBe("Sure yes");
    expect(shown("[mysterious] Hello")).toBe("Hello");
    expect(shown("Hello [cur")).toBe("Hello ");
  });

  it("writes Talis T-V as TalisTV", () => {
    expect(shown("Talis T-V sets up promotions")).toBe("TalisTV sets up promotions");
    expect(shown("through Talis TV.")).toBe("through TalisTV.");
  });
});
