import { describe, expect, it } from "vitest";
import {
  AISHA_CALL_SOURCE,
  AISHA_CRM_POSITION,
  AISHA_CRM_STATUS,
  buildAishaCrmContactDraft,
  findExistingCrmContact,
  inferLeadCountry,
} from "@/lib/aisha-crm-contact";
import {
  appendCrmNotes,
  applyCrmFieldPermissions,
  CRM_PLACEHOLDER_BROKERAGE_NAME,
  isCapturedIdentityValue,
  lockedLeadFormFields,
} from "@/lib/crm-leads/field-permissions";
import type { NormalizedLead } from "@/lib/crm-leads/model";

const meeting = {
  id: "conv_new_1",
  title: "Halifax registration",
  summary: "Chris in Halifax, Nova Scotia wants to register after the call.",
  callerName: "Chris Wood",
  validContact: { kind: "email" as const, value: "chris@woodrealty.example" },
  fields: {
    account_type_interest: "Agent",
    business_type: "Wood Realty",
    market_location: "Halifax, Nova Scotia",
    fast_code: "DC12",
    goals: "Bring the team onto a Mapsite",
  },
  transcript: [{ role: "user", message: "I'd like to register." }],
};

function lead(overrides: Partial<NormalizedLead> & { source?: string | null } = {}): NormalizedLead & {
  source?: string | null;
  sourceConversationId?: string | null;
  fastCode?: string | null;
  createdAt?: string | null;
} {
  return {
    decisionMakerName: "Chris Wood",
    position: "prospect",
    cellPhone: "416-555-0199",
    email: "chris@woodrealty.example",
    brokerageName: "Wood Realty",
    brokerageWebsite: null,
    brokerageAddress: null,
    officePhone: null,
    latitude: null,
    longitude: null,
    country: "Canada",
    market: "Halifax, Nova Scotia",
    status: "new",
    notes: "Potential Prospect from an Aisha Call.\nTranscript reference: Aisha conversation conv_new_1",
    source: AISHA_CALL_SOURCE,
    sourceConversationId: "conv_new_1",
    fastCode: "dc12",
    createdAt: "2026-11-26T12:00:00.000Z",
    ...overrides,
  };
}

describe("Aisha CRM contact draft", () => {
  it("populates available fields, sets source Aisha Call, and uses the existing New status as Potential Prospect", () => {
    const draft = buildAishaCrmContactDraft(meeting);
    expect(draft.source).toBe("Aisha Call");
    expect(draft.sourceConversationId).toBe("conv_new_1");
    expect(draft.status).toBe(AISHA_CRM_STATUS);
    expect(draft.status).toBe("new");
    expect(draft.position).toBe(AISHA_CRM_POSITION);
    expect(draft.decisionMakerName).toBe("Chris Wood");
    expect(draft.email).toBe("chris@woodrealty.example");
    expect(draft.brokerageName).toBe("Wood Realty");
    expect(draft.market).toBe("Halifax, Nova Scotia");
    expect(draft.country).toBe("Canada");
    expect(draft.fastCode).toBe("dc12");
    expect(draft.notes).toContain("Potential Prospect from an Aisha Call.");
    expect(draft.notes).toContain("Transcript reference: Aisha conversation conv_new_1");
    expect(draft.notes).toContain("Summary: Chris in Halifax");
  });

  it("infers USA vs Canada and uses placeholders when identity is missing", () => {
    expect(inferLeadCountry("Austin, Texas")).toBe("USA");
    const draft = buildAishaCrmContactDraft({
      id: "conv_unknown",
      callerName: null,
      fields: {},
    });
    expect(draft.decisionMakerName).toBe("Unknown caller");
    expect(draft.brokerageName).toBe(CRM_PLACEHOLDER_BROKERAGE_NAME);
    expect(draft.country).toBeNull();
  });
});

describe("CRM contact deduplication", () => {
  const existing = [
    {
      id: "lead-1",
      sourceConversationId: "conv_new_1",
      email: "chris@woodrealty.example",
      cellPhone: "4165550199",
    },
  ];

  it("reuses the contact when the same conversation is ingested again (webhook retry)", () => {
    const hit = findExistingCrmContact(
      { sourceConversationId: "conv_new_1", email: "chris@woodrealty.example", cellPhone: "416-555-0199" },
      existing,
    );
    expect(hit).toEqual({ match: existing[0], reason: "conversation" });
  });

  it("deduplicates by email or phone when the conversation id is new", () => {
    expect(
      findExistingCrmContact({ sourceConversationId: "conv_new_2", email: "CHRIS@woodrealty.example", cellPhone: null }, existing)
        ?.reason,
    ).toBe("email");
    expect(
      findExistingCrmContact({ sourceConversationId: "conv_new_3", email: null, cellPhone: "+1 (416) 555-0199" }, existing)
        ?.reason,
    ).toBe("phone");
    expect(
      findExistingCrmContact(
        { sourceConversationId: "conv_brand_new", email: "new@example.com", cellPhone: "6475550100" },
        existing,
      ),
    ).toBeNull();
  });
});

describe("CRM field-level permissions for Rishav", () => {
  const rishav = { role: "agent" as const };
  const admin = { role: "superadmin" as const };

  it("locks captured identity and source fields in the UI for an associate, not for Global Admin", () => {
    expect(lockedLeadFormFields(rishav, lead())).toEqual([
      "decision_maker_name",
      "cell_phone",
      "email",
      "brokerage_name",
      "market",
    ]);
    expect(lockedLeadFormFields(admin, lead())).toEqual([]);
    expect(isCapturedIdentityValue("brokerage_name", "Unknown brokerage")).toBe(false);
    expect(lockedLeadFormFields(rishav, lead({ brokerageName: "Unknown brokerage", cellPhone: null, email: null, market: null }))).toEqual(
      ["decision_maker_name"],
    );
  });

  it("server-side: rejects overwrites of locked fields and allows status, empty fields, and appended notes", () => {
    const current = lead();
    const proposed: NormalizedLead = {
      ...current,
      decisionMakerName: "Hacked Name",
      cellPhone: "000",
      email: "other@example.com",
      brokerageName: "Other Co",
      market: "Toronto",
      status: "contacted",
      country: "USA",
      brokerageAddress: "12 Main St",
      notes: "Called back, left a voicemail.",
    };
    const applied = applyCrmFieldPermissions({ actor: rishav, current, proposed });
    expect(applied.lead.decisionMakerName).toBe("Chris Wood");
    expect(applied.lead.cellPhone).toBe("416-555-0199");
    expect(applied.lead.email).toBe("chris@woodrealty.example");
    expect(applied.lead.brokerageName).toBe("Wood Realty");
    expect(applied.lead.market).toBe("Halifax, Nova Scotia");
    expect(applied.ignoredFields).toEqual(expect.arrayContaining([
      "decision_maker_name",
      "cell_phone",
      "email",
      "brokerage_name",
      "market",
      "notes_overwrite",
    ]));
    expect(applied.lead.status).toBe("contacted");
    expect(applied.lead.country).toBe("USA");
    expect(applied.lead.brokerageAddress).toBe("12 Main St");
    expect(applied.lead.notes).toContain("Transcript reference: Aisha conversation conv_new_1");
    expect(applied.lead.notes).toContain("Called back, left a voicemail.");
  });

  it("lets Rishav fill a previously empty phone or email, and lets Global Admin overwrite anything", () => {
    const current = lead({ cellPhone: null, email: null });
    const filled = applyCrmFieldPermissions({
      actor: rishav,
      current,
      proposed: { ...current, cellPhone: "647-555-0100", email: "chris@woodrealty.example" },
    });
    expect(filled.lead.cellPhone).toBe("647-555-0100");
    expect(filled.lead.email).toBe("chris@woodrealty.example");
    expect(filled.ignoredFields).toEqual([]);

    const overwritten = applyCrmFieldPermissions({
      actor: admin,
      current: lead(),
      proposed: { ...lead(), decisionMakerName: "Christopher Wood" },
    });
    expect(overwritten.lead.decisionMakerName).toBe("Christopher Wood");
    expect(overwritten.ignoredFields).toEqual([]);
  });

  it("appends notes and refuses to drop the original transcript reference", () => {
    const prev = "Potential Prospect from an Aisha Call.\nTranscript reference: Aisha conversation conv_new_1";
    expect(appendCrmNotes(prev, prev + "\n\nFollowed up.")).toBe(prev + "\n\nFollowed up.");
    expect(appendCrmNotes(prev, "Followed up.")).toBe(`${prev}\n\nFollowed up.`);
    expect(appendCrmNotes(prev, "")).toBe(prev);
  });
});
