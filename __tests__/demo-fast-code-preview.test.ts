import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  extractInitials,
  validateAndNormalizeFastCodeInput,
} from "../validators/fast-code.validator";
import { previewFastCodeFromFullName } from "../components/talispros/DemoFastCodePreview";

describe("demo FAST Code generation preview", () => {
  it("builds initials-only preview codes without &/+ characters", () => {
    const normalized = validateAndNormalizeFastCodeInput({
      firstName: "Lydia & Richard",
      lastName: "Gaertner",
    });
    const initials = extractInitials(normalized);
    expect(initials).toBe("lrg");
    expect(initials).not.toMatch(/[&+]/);
    expect(previewFastCodeFromFullName("Lydia & Richard Gaertner")).toBe("lrg##");
    expect(previewFastCodeFromFullName("Arun Rachuri")).toBe("ar##");
  });

  it("wires claim registration + demo builder to the preview /start claim path", () => {
    const form = readFileSync(
      resolve("components/talispros/TalisprosMarketRegistrationForm.tsx"),
      "utf8",
    );
    expect(form).toContain("DemoFastCodePreview");
    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).toContain('href="/start"');
    expect(builder).toContain("Realtor / FSBO claim");
    expect(builder).not.toContain("Claim Your Market");
  });
});
