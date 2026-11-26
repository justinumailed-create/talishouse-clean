import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import {
  PIN_ACCOUNT_LEVELS,
  PIN_ASSIGNMENT_RULES,
  assignedPinsForBroker,
  brokerTargetError,
  isMissingAssignmentColumn,
  normalizeAssignedFastCode,
  pinAccountLevelForAccountType,
  pinAccountLevelForAudience,
  validatePinAssignment,
} from "@/lib/talispros/mapsite-pin-assignment";
import {
  clearFormDraft,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
  type FormDraftStorage,
} from "@/lib/talispros/form-drafts";
import { pinDraftHasWork } from "@/components/talispros/mapsite/MapSitePinDashboard";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function memoryStorage(): FormDraftStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("Assign to Mapsite: account levels", () => {
  it("covers all four account levels with FAST Code based rules", () => {
    expect([...PIN_ACCOUNT_LEVELS].sort()).toEqual(["adpro", "agent", "broker", "fsbo"]);
    expect(PIN_ASSIGNMENT_RULES.broker).toMatchObject({ ownMapsite: true, required: false });
    expect(PIN_ASSIGNMENT_RULES.fsbo).toMatchObject({ ownMapsite: true, required: false });
    expect(PIN_ASSIGNMENT_RULES.adpro).toMatchObject({ ownMapsite: true, required: false });
    expect(PIN_ASSIGNMENT_RULES.agent).toMatchObject({ ownMapsite: false, required: true });
  });

  it("maps audiences and account types to a level", () => {
    expect(pinAccountLevelForAudience("brokers")).toBe("broker");
    expect(pinAccountLevelForAudience("fsbos")).toBe("fsbo");
    expect(pinAccountLevelForAudience("adpro")).toBe("adpro");
    expect(pinAccountLevelForAudience("listings")).toBe("agent");
    expect(pinAccountLevelForAccountType("root")).toBe("broker");
    expect(pinAccountLevelForAccountType("corporate")).toBe("broker");
    expect(pinAccountLevelForAccountType("derivative")).toBe("agent");
    expect(pinAccountLevelForAccountType("fsbo")).toBe("fsbo");
    expect(pinAccountLevelForAccountType("adpro")).toBe("adpro");
  });
});

describe("Assign to Mapsite: validation", () => {
  it("requires a Broker FAST Code for Agents", () => {
    expect(validatePinAssignment({ level: "agent", ownFastCode: "ag01", assignedFastCode: "" })).toEqual({
      ok: false,
      error: "required",
    });
    expect(validatePinAssignment({ level: "agent", ownFastCode: "ag01", assignedFastCode: "AG01" })).toEqual({
      ok: false,
      error: "self",
    });
    expect(validatePinAssignment({ level: "agent", ownFastCode: "ag01", assignedFastCode: " DC06 " })).toEqual({
      ok: true,
      assignedFastCode: "dc06",
    });
  });

  it("keeps FSBO, Ad Pro and Broker optional, defaulting to their own Mapsite", () => {
    for (const level of ["fsbo", "adpro", "broker"] as const) {
      expect(validatePinAssignment({ level, ownFastCode: "own1", assignedFastCode: "" })).toEqual({
        ok: true,
        assignedFastCode: null,
      });
      expect(validatePinAssignment({ level, ownFastCode: "own1", assignedFastCode: "OWN1" })).toEqual({
        ok: true,
        assignedFastCode: null,
      });
    }
    expect(validatePinAssignment({ level: "fsbo", ownFastCode: "fs01", assignedFastCode: "dc06" })).toEqual({
      ok: true,
      assignedFastCode: "dc06",
    });
    expect(validatePinAssignment({ level: "adpro", ownFastCode: "ap01", assignedFastCode: "DC06" })).toEqual({
      ok: true,
      assignedFastCode: "dc06",
    });
  });

  it("normalises typed FAST Codes and rejects invalid ones", () => {
    expect(normalizeAssignedFastCode("FAST Code: DC 06")).toBe("dc06");
    expect(normalizeAssignedFastCode("  ")).toBe("");
    expect(normalizeAssignedFastCode("not a code!")).toBeNull();
    expect(validatePinAssignment({ level: "fsbo", ownFastCode: "fs01", assignedFastCode: "??" })).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("only accepts an existing Broker Mapsite as the target", () => {
    expect(brokerTargetError({ exists: false, level: null })).toBeTruthy();
    expect(brokerTargetError({ exists: true, level: "fsbo" })).toBeTruthy();
    expect(brokerTargetError({ exists: true, level: "broker" })).toBeNull();
  });
});

describe("Broker Mapsite displays assigned PINs", () => {
  it("shows Agent, FSBO and Ad Pro PINs assigned to the Broker FAST Code", () => {
    const pins = assignedPinsForBroker({
      brokerFastCode: "DC06",
      brokerMapsiteId: "broker",
      rows: [
        { id: "a", mapsite_id: "agent", latitude: 46.1, longitude: -60.2, label: "Agent listing", category: null, assigned_fast_code: "dc06" },
        { id: "f", mapsite_id: "fsbo", latitude: 46.2, longitude: -60.3, label: null, category: null, assigned_fast_code: "dc06" },
        { id: "p", mapsite_id: "adpro", latitude: 46.3, longitude: -60.4, label: "Ad", category: null, assigned_fast_code: "dc06" },
        { id: "x", mapsite_id: "agent", latitude: 1, longitude: 1, label: "Other", category: null, assigned_fast_code: "rm22" },
        { id: "s", mapsite_id: "broker", latitude: 1, longitude: 1, label: "Own", category: null, assigned_fast_code: "dc06" },
      ],
      sources: [
        { id: "agent", fastCode: "ag01", level: "agent", href: "/map/ag01" },
        { id: "fsbo", fastCode: "fs01", level: "fsbo", href: "/map/fs01" },
        { id: "adpro", fastCode: "ap01", level: "adpro", href: "/map/ap01" },
        { id: "broker", fastCode: "dc06", level: "broker", href: "/map/dc06" },
      ],
    });
    expect(pins.map((pin) => pin.id)).toEqual(["assigned:a", "assigned:f", "assigned:p"]);
    expect(pins[0].label).toBe("AG01 · Agent listing");
    expect(pins[1].label).toBe("FS01 · PIN");
  });

  it("feeds assigned PINs into the Broker Mapsite partner pins", () => {
    const service = read("lib/talispros/mapsite-root-partners-service.ts");
    expect(service).toContain('.eq("assigned_fast_code"');
    expect(service).toContain("loadPinsAssignedTo");
    expect(service).toContain("partnerPins");
  });

  it("stays safe before the migration is applied", () => {
    expect(isMissingAssignmentColumn('column mapsite_additional_pins.assigned_fast_code does not exist')).toBe(true);
    expect(isMissingAssignmentColumn("permission denied")).toBe(false);
    const migration = read("supabase/migrations/132_mapsite_pin_assigned_fast_code.sql");
    expect(migration).toContain("add column if not exists assigned_fast_code text");
  });
});

describe("Assign to Mapsite field in the Add Pin flow", () => {
  const panel = read("components/talispros/mapsite/MapSitePinDashboard.tsx");

  it("is step 2, right after Add PIN, for every account level", () => {
    const add = panel.indexOf("title={d.step1Title}");
    const assign = panel.indexOf('data-testid="pin-assign-to-mapsite"');
    const place = panel.indexOf("title={d.step3Title}");
    expect(add).toBeGreaterThan(0);
    expect(assign).toBeGreaterThan(add);
    expect(assign).toBeLessThan(place);
    expect(panel).toContain("step={2}\n          title={d.step2Title}");
    // Rendered unconditionally: no account-level guard around the field.
    expect(panel).not.toMatch(/accountLevel === "[a-z]+" \?\s*\(\s*<label[^>]*pin-assign-to-mapsite/);
    expect(panel).toContain("PIN_ASSIGNMENT_RULES[accountLevel]");
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("accountLevel={pinAccountLevelForAccountType(accountType)}");
  });

  it("marks Agents Required and the others Optional, and gates Agent placement", () => {
    expect(panel).toContain("assignRule.required ? d.assignRequired : d.assignOptional");
    expect(panel).toContain('data-testid="pin-assign-needed"');
    expect(panel).toContain("const placementReady = assignCheck.ok;");
    expect(en.mapsite.pinDashboard.assignRequired).toBe("Required");
    expect(en.mapsite.pinDashboard.assignOptional).toBe("Optional");
    for (const key of ["assignHelpBroker", "assignHelpFsbo", "assignHelpAdpro", "assignHelpAgent"] as const) {
      expect(en.mapsite.pinDashboard[key]).toBeTruthy();
      expect(de.mapsite.pinDashboard[key]).toBeTruthy();
      expect(en.mapsite.pinDashboard[key]).not.toContain("—");
    }
  });

  it("sends the assignment with search, map click and edit placements", () => {
    expect(panel).toContain("assignedFastCode: placeAssignment,");
    expect(panel).toContain("assignedFastCode: editAssign,");
    expect(panel).toContain('onEditorChange({ kind: "place", assignedFastCode: placeAssignment })');
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("assignedFastCode: pinEditor.assignedFastCode ?? null");
    const actions = read("app/talispros/mapsite/pin-actions.ts");
    expect(actions).toContain("resolvePinAssignment");
  });
});

describe("Assign to Mapsite draft persistence", () => {
  it("keeps the assigned FAST Code in the Add Pin draft", () => {
    const storage = memoryStorage();
    const key = formDraftKey("mapsite-pin", "AG01");
    writeFormDraft(key, { label: "", assignFastCode: "DC06", editAssign: "" }, storage, 1000);
    expect(readFormDraft<{ assignFastCode: string }>(key, storage, 2000)?.assignFastCode).toBe("DC06");
    clearFormDraft(key, storage);
    expect(readFormDraft(key, storage, 2000)).toBeNull();
  });

  it("counts a remembered assignment as draft work, but not for the restored notice", () => {
    expect(pinDraftHasWork({ assignFastCode: "DC06" })).toBe(true);
    expect(pinDraftHasWork({ assignFastCode: "DC06" }, { includeAssignment: false })).toBe(false);
    expect(pinDraftHasWork({ assignFastCode: "" })).toBe(false);
    const panel = read("components/talispros/mapsite/MapSitePinDashboard.tsx");
    expect(panel).toContain("assignFastCode: draftString(draft.assignFastCode)");
    expect(panel).toContain("editAssign: draftString(draft.editAssign)");
    expect(panel).toMatch(/assignFastCode,\n\s+editAssign: editingId \? editAssign : ""/);
  });
});
