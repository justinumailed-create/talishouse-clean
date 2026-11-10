import { describe, expect, it } from "vitest";
import {
  brokerageMatchScore,
  compactBrokerageKey,
  contactGaps,
  countryFromRegion,
  fastCodeFromToken,
  isCompleteContact,
  parseProspectImportCsv,
  partitionReview,
  planProspectImport,
  queueIdsFromToken,
  splitBrokerName,
  type ApprovalLead,
  type QueueSnapshot,
} from "@/lib/talispros/prospect-approval";

function queue(partial: Partial<QueueSnapshot> & Pick<QueueSnapshot, "id" | "brokerage">): QueueSnapshot {
  return {
    town: "Corner Brook",
    province: "NL",
    country: "CA",
    status: "pending",
    proposed_code: null,
    contact_first_name: null,
    contact_last_name: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    contact_position: null,
    office_phone: null,
    office_address: null,
    website: null,
    source_url: "https://maps.google.com/?cid=1",
    research_notes: null,
    ...partial,
  };
}

function lead(partial: Partial<ApprovalLead> & Pick<ApprovalLead, "id" | "brokerage">): ApprovalLead {
  return {
    town: "Gander",
    province: "NL",
    country: "CA",
    status: "pending",
    proposed_code: null,
    contact_first_name: null,
    contact_last_name: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    contact_position: null,
    research_notes: null,
    created_at: "2026-11-10T00:00:00.000Z",
    ...partial,
  };
}

describe("prospect approval contacts", () => {
  it("requires name, phone and email before approval and does not treat that as a hard failure", () => {
    const rows = [
      lead({
        id: "11111111-1111-4111-8111-111111111111",
        brokerage: "Complete Realty",
        contact_first_name: "Ada",
        contact_last_name: "Lovelace",
        contact_phone: "709-555-0100",
        contact_email: "ada@example.com",
        proposed_code: "al01",
      }),
      lead({
        id: "22222222-2222-4222-8222-222222222222",
        brokerage: "Missing Phone",
        contact_first_name: "Grace",
        contact_last_name: "Hopper",
        contact_email: "grace@example.com",
      }),
    ];
    const result = partitionReview(rows, "approved");
    expect(result.allow.map((row) => row.brokerage)).toEqual(["Complete Realty"]);
    expect(result.blocked).toEqual([
      { id: rows[1]!.id, brokerage: "Missing Phone", missing: ["phone"], reason: "incomplete" },
    ]);
    expect(contactGaps(rows[1]!)).toEqual(["phone"]);
    expect(isCompleteContact(rows[0]!)).toBe(true);
    expect(partitionReview([lead({ id: rows[0]!.id, brokerage: "Closed", status: "approved" })], "rejected").blocked[0]?.reason).toBe("closed");
  });

  it("splits a researched broker name and ignores a parenthetical nickname", () => {
    expect(splitBrokerName("Christopher (Chris) Dang")).toEqual({ firstName: "Christopher", lastName: "Dang" });
    expect(splitBrokerName("Hermance Mercure Laplante")).toEqual({ firstName: "Hermance", lastName: "Mercure Laplante" });
    expect(splitBrokerName("Madonna")).toEqual({ firstName: "Madonna", lastName: "" });
  });

  it("reads country from a province or a state column", () => {
    expect(countryFromRegion("NL")).toBe("CA");
    expect(countryFromRegion("QC")).toBe("CA");
    expect(countryFromRegion("WV", "state")).toBe("US");
    expect(countryFromRegion("", "state")).toBe("US");
    expect(countryFromRegion("")).toBe("CA");
  });
});

describe("prospect CSV import plan", () => {
  const legacy = `fast_code,brokerage_name,first_name,last_name,position,phone,phone_type,email,town,province,status,source_url
pq:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa,KSAB Real Estate,Darren,Brake,Owner,709-632-1415,cell,darren@example.com,Corner Brook,NL,complete,https://ksab.example/darren
ys01,Grassroots Realty,Yuri,Smith,Broker,587-555-0101,cell,yuri@example.com,Canmore,AB,complete,https://grassroots.example/yuri
`;

  const research = `market,anchor_town,province,rank,brokerage_name,broker_name,position,cell,office_phone,email,office_address,website,source_url,fast_code_or_prospect_id,notes
"Thetford Mines, QC",Thetford Mines,QC,3,Groupe Morin Gagnon Courtiers immobiliers (Maxxum 100 Centre inc.),Vincent Morin,Owner,418-281-4666,418-281-4666,vmorin@example.com,405 Rue Boutin,https://vmorin.example,https://vmorin.example/vincent,bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb,Owner
"Rivière-du-Loup, QC",Rivière-du-Loup,QC,R1,Immeubles G.L.M.C. inc.,Claude Boucher,President,418-862-9015,418-862-9015,info@glmc.example,103 rue,https://glmc.example,https://glmc.example/claude,replacement (not in site DB),REPLACEMENT
`;

  const usa = `market,anchor_town,state,rank,brokerage_name,broker_name,position,cell,office_phone,email,office_address,website,source_url,notes
North Central WV,Morgantown,WV,1,KLM Properties,Chaille Adkins,Broker,304-276-1701,304-296-1533,klm@example.com,1533 Mileground,https://klm.example,https://klm.example/chaille,Independent
`;

  it("accepts the admin columns and the research columns", () => {
    const admin = parseProspectImportCsv(legacy);
    expect(admin[0]?.format).toBe("legacy");
    expect(admin[0]?.firstName).toBe("Darren");
    expect(queueIdsFromToken(admin[0]?.matchToken)).toEqual(["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]);
    expect(fastCodeFromToken(admin[1]?.matchToken)).toBe("ys01");
    const researched = parseProspectImportCsv(research);
    expect(researched[0]?.format).toBe("research");
    expect(researched[0]?.firstName).toBe("Vincent");
    expect(researched[0]?.lastName).toBe("Morin");
    expect(researched[0]?.phone).toBe("418-281-4666");
    expect(researched[0]?.country).toBe("CA");
    expect(researched[1]?.country).toBe("CA");
    expect(parseProspectImportCsv(usa)[0]?.country).toBe("US");
  });

  it("matches by queue id, FAST Code or brokerage plus town, and inserts the rest", () => {
    const rows = [...parseProspectImportCsv(legacy), ...parseProspectImportCsv(research), ...parseProspectImportCsv(usa)];
    const plan = planProspectImport({
      rows,
      queue: [
        queue({
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          brokerage: "KSAB Real Estate",
          contact_email: "old@example.com",
        }),
        queue({
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          brokerage: "Groupe Morin Gagnon Courtiers immobiliers",
          town: "Thetford Mines",
          province: "QC",
        }),
      ],
      issuedCodes: new Set(["ys01"]),
      leads: [{ fastCode: "ys01", decisionMakerName: "Yuri Smith", cellPhone: "587-555-0199", officePhone: null, email: "kept@example.com" }],
      takenCodes: new Set(["ys01"]),
    });
    const kinds = plan.items.map((item) => item.kind);
    expect(kinds).toEqual(["matched", "matched", "matched", "new", "new"]);
    expect(plan.matched).toBe(3);
    expect(plan.newCa).toBe(1);
    expect(plan.newUs).toBe(1);
    expect(plan.incomplete).toBe(0);
    const emailChange = plan.overwrites.find((row) => row.field === "email");
    expect(emailChange).toMatchObject({ from: "old@example.com", to: "darren@example.com", apply: true });
    const leadPhone = plan.items[1];
    expect(leadPhone?.kind).toBe("matched");
    if (leadPhone?.kind === "matched") {
      expect(leadPhone.target).toBe("lead");
      expect(leadPhone.changes.find((change) => change.field === "phone")).toMatchObject({ apply: false, from: "587-555-0199" });
      expect(leadPhone.changes.find((change) => change.field === "email")?.apply).toBe(false);
    }
    const created = plan.items.find((item) => item.kind === "new" && item.country === "US");
    expect(created?.kind === "new" && created.draft.sourced_by).toBe("TalisBOT™");
    expect(created?.kind === "new" && created.draft.province).toBe("WV");
  });

  it("matches a legal-name suffix and a spaced initialism to the queue row", () => {
    expect(compactBrokerageKey("K.S.A.B. Real Estate")).toBe(compactBrokerageKey("KSAB Real Estate"));
    expect(brokerageMatchScore("Groupe Morin Gagnon Courtiers immobiliers", "Groupe Morin Gagnon Courtiers immobiliers (Maxxum 100 Centre inc.)")).toBeGreaterThan(0);
    const plan = planProspectImport({
      rows: parseProspectImportCsv(research).slice(0, 1),
      queue: [queue({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", brokerage: "Groupe Morin Gagnon Courtiers immobiliers", town: "Thetford Mines", province: "QC" })],
      issuedCodes: new Set(),
    });
    expect(plan.items[0]).toMatchObject({ kind: "matched", queueId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" });
  });

  it("skips a row that has no brokerage source and no contact", () => {
    const [row] = parseProspectImportCsv(`broker_name,brokerage_name,anchor_town,province,source_url\n,,Gander,NL,\n`);
    const plan = planProspectImport({ rows: row ? [row] : [], queue: [], issuedCodes: new Set() });
    expect(plan.incomplete).toBe(1);
    expect(plan.items[0]).toMatchObject({ kind: "incomplete" });
  });

  it("does not insert a second row when the same brokerage appears twice in one file", () => {
    const csv = `brokerage_name,broker_name,cell,email,anchor_town,state,source_url
Harbor Realty,Ann Owner,304-555-0101,ann@example.com,Morgantown,WV,https://harbor.example/ann
Harbor Realty,Ben Broker,304-555-0102,ben@example.com,Morgantown,WV,https://harbor.example/ben
`;
    const plan = planProspectImport({ rows: parseProspectImportCsv(csv), queue: [], issuedCodes: new Set() });
    expect(plan.newUs).toBe(1);
    expect(plan.matched).toBe(1);
    const created = plan.items.find((item) => item.kind === "new");
    expect(created?.kind === "new" && created.draft.contact_first_name).toBe("Ben");
    expect(plan.overwrites.some((row) => row.field === "first_name" && row.apply)).toBe(true);
  });
});
