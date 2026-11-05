import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

/** Inputs where an admin FAST Code, agent password, or access code is typed. */
const MASKED = [
  "components/admin/AdminLoginForm.tsx",
  "components/FastCodeGate.tsx",
  "app/crm/login/page-client.tsx",
  "components/mapsite/MapSiteEditGate.tsx",
  "components/talisu/RegisterActions.tsx",
  "components/talispros/mapsite/MapSiteUrlGateDialog.tsx",
  "components/talispros/RegisterYourMapSiteClient.tsx",
  "components/talispros/demo-mapsite/FastCodeSlotsPanel.tsx",
  "components/talisu/TalisUKbUnlockForm.tsx",
  "components/talisu/TsplitsPlaybookGate.tsx",
  "app/talispros/client/login/ClientLoginForm.tsx",
  "components/admin/agents/AgentPasswordPanel.tsx",
  "app/agent/AgentAuthForm.tsx",
];

/** Visitor lookup of a prospect code such as kk01. These stay visible. */
const PUBLIC_LOOKUP = [
  "components/talispros/TalisprosHomeFastCodeEntry.tsx",
  "components/talisbooks/library/BookshelfUnlockPanel.tsx",
  "app/partner-access/page-client.tsx",
  "components/talispros/demo-mapsite/DemoFastCodeCard.tsx",
  "components/admin/AdminAccessGrantsClient.tsx",
  "components/admin/AdminFreePinCreditsPanel.tsx",
];

describe("masked admin and access-code entry", () => {
  it("masks every secret field and keeps the value out of the URL", () => {
    const field = read("components/talispros/SecretTextField.tsx");
    expect(field).toContain('type={visible ? "text" : "password"}');
    expect(field).toContain('autoComplete = "new-password"');
    expect(field).toContain("showSecret");
    expect(field).toContain("hideSecret");
    expect(field).not.toContain("console.");

    for (const path of MASKED) {
      const source = read(path);
      expect(source, path).toContain("SecretTextField");
      expect(source, path).not.toContain('type="text"');
      expect(source, path).not.toContain("console.log");
      expect(source, path).not.toContain("console.warn");
    }
  });

  it("leaves public FAST Code lookup fields visible", () => {
    for (const path of PUBLIC_LOOKUP) {
      const source = read(path);
      expect(source, path).not.toContain("SecretTextField");
      expect(source, path).toContain("<input");
    }
    const register = read("components/talispros/RegisterYourMapSiteClient.tsx");
    expect(register).toContain('placeholder="Enter your FAST Code"');
    const rail = read("components/talispros/demo-mapsite/FastCodeSlotsPanel.tsx");
    expect(rail).toContain("<input");
  });

  it("labels the reveal control in English and German", () => {
    expect(en.common.showSecret).toBe("Show");
    expect(en.common.hideSecret).toBe("Hide");
    expect(de.common.showSecret).toBe("Zeigen");
    expect(de.common.hideSecret).toBe("Verbergen");
    expect(en.secretEntry.adminLabel).not.toBe(de.secretEntry.adminLabel);
    expect(en.secretEntry.gateLabel).not.toBe(de.secretEntry.gateLabel);
  });
});
