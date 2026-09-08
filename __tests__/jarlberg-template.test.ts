import { describe, expect, it } from "vitest";
import {
  createJarlbergSlotState,
  jarlbergInteriorRole,
  JARLBERG_DEFAULT_COPY,
  JARLBERG_INTERIOR_COUNT,
} from "../lib/talisbooks/jarlberg-template";

describe("Jarlberg Talisbook™ template", () => {
  it("maps interior pages to replaceable layout roles", () => {
    expect(jarlbergInteriorRole(1)).toBe("map-dome");
    expect(jarlbergInteriorRole(4)).toBe("photo-caption");
    expect(jarlbergInteriorRole(9)).toBe("four-up");
    expect(jarlbergInteriorRole(10)).toBe("split-copy");
    expect(jarlbergInteriorRole(11)).toBe("parting");
    expect(JARLBERG_INTERIOR_COUNT).toBe(11);
  });

  it("seeds replaceable cover details from the agent", () => {
    const slots = createJarlbergSlotState({
      agentName: "Arun yui",
      agentPhone: "+1-555-0100",
    });
    expect(slots.agentName).toBe("Arun yui");
    expect(slots.agentPhone).toBe("+1-555-0100");
    expect(slots.frontTitle).toBe(JARLBERG_DEFAULT_COPY.frontTitle);
    expect(slots.photoCaptions).toHaveLength(7);
    expect(slots.neighbourImages).toHaveLength(4);
    expect(slots.investorBody).toContain("+1-555-0100");
  });
});
