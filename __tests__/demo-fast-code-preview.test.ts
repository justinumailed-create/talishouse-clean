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

  it("wires claim registration + in-place demo claim to FAST Code™ preview", () => {
    const form = readFileSync(
      resolve("components/talispros/TalisprosMarketRegistrationForm.tsx"),
      "utf8",
    );
    expect(form).toContain("DemoFastCodePreview");

    const claimButton = readFileSync(
      resolve("components/talispros/mapsite/DemoClaimMarketButton.tsx"),
      "utf8",
    );
    expect(claimButton).toContain("DemoFastCodePreview");

    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).not.toContain('href="/start"');
    expect(builder).not.toContain("Realtor / FSBO claim");
    expect(builder).not.toContain("Claim Your Market");
  });
});
