import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AGENT_SCOPE_LABELS, accountHasAdminScope, sanitizeAgentScopes, type AdminAccount } from "@/lib/admin-constants";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { getAdminNavItems } from "@/lib/admin-nav";
import { crmCopy } from "@/lib/crm-leads/copy";
import {
  applyMapping,
  autoMapColumns,
  canDeleteLeads,
  canEditLead,
  classifyImportRows,
  csvTemplate,
  parseCsv,
  validateLeadValues,
} from "@/lib/crm-leads/model";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const agent = (scopes: string[]): AdminAccount => ({
  name: "Aritri",
  fastCode: "@aritri",
  email: null,
  access: "agent",
  scopes: sanitizeAgentScopes(scopes),
  agentId: "34312ace-941d-4934-880e-e49e93fec86d",
});

const DAILY = `Decision maker name,Position,Cell phone,Email,Brokerage name,Website,Address,Office phone,Latitude,Longitude,Country,Market,Status,Notes
Jane Doe,Managing Broker,416-555-0100,jane@north.example,"North Shore Realty",https://north.example,"123 Main St, Toronto ON",416-555-0199,43.65,-79.38,Canada,Toronto,new,Met at the open house
Sam Cole,Intern,123,not-an-email,Acme Homes,,,,,,USA,Austin,,
Jane Doe,Broker,(416) 555-0100,jane@north.example,North Shore Realty,north.example,123 Main,,,,Canada,Toronto,,Second copy
Pat Lee,Team Leader,604-555-0142,pat@west.example,Westwind Realty,west.example,"88 Broadway, Vancouver",604-555-0140,,,ca,Vancouver,contacted,"Said ""call Friday"""
`;

describe("brokerage lead CSV import", () => {
  it("auto-maps a daily Canada/USA sheet and flags bad rows and duplicates", () => {
    const table = parseCsv(DAILY);
    expect(table).toHaveLength(5);
    expect(table[1][6]).toBe("123 Main St, Toronto ON");
    expect(table[4][13]).toBe('Said "call Friday"');
    const mapping = autoMapColumns(table[0]);
    expect(mapping.decision_maker_name).toBe(0);
    expect(mapping.position).toBe(1);
    expect(mapping.cell_phone).toBe(2);
    expect(mapping.email).toBe(3);
    expect(mapping.brokerage_name).toBe(4);
    expect(mapping.brokerage_website).toBe(5);
    expect(mapping.brokerage_address).toBe(6);
    expect(mapping.office_phone).toBe(7);
    expect(mapping.country).toBe(10);
    expect(mapping.market).toBe(11);

    const existing = classifyImportRows({
      rows: applyMapping(table, mapping),
      existing: [{
        id: "existing-1",
        email: "pat@west.example",
        cellPhone: null,
        officePhone: "6045550140",
        brokerageName: "Other Office",
        decisionMakerName: "Someone Else",
      }],
    });

    expect(existing[0].errors).toEqual([]);
    expect(existing[0].duplicate).toBeNull();
    expect(existing[0].lead).toMatchObject({
      decisionMakerName: "Jane Doe",
      position: "managing_broker",
      country: "Canada",
      market: "Toronto",
      latitude: 43.65,
      longitude: -79.38,
    });

    expect(existing[1].lead).toBeNull();
    expect(existing[1].errors.map((issue) => issue.code)).toEqual(expect.arrayContaining(["position", "phone", "email"]));

    expect(existing[2].duplicate?.reason).toBe("email");
    expect(existing[2].duplicate?.matchId).toBeNull();

    expect(existing[3].duplicate?.reason).toBe("email");
    expect(existing[3].duplicate?.matchId).toBe("existing-1");
    expect(existing[3].lead?.position).toBe("team_leader");
    expect(existing[3].lead?.country).toBe("Canada");
    expect(existing[3].lead?.notes).toBe('Said "call Friday"');
  });

  it("matches brokerage plus decision-maker and normalized phones", () => {
    const [row] = classifyImportRows({
      rows: [{
        rowNumber: 2,
        values: {
          decision_maker_name: "Aritri Shah",
          position: "acting broker",
          cell_phone: "+1 (647) 555-0188",
          brokerage_name: "Harbour Realty",
          country: "United States",
          status: "not interested",
        },
      }],
      existing: [{
        id: "lead-2",
        email: null,
        cellPhone: "6475550188",
        officePhone: null,
        brokerageName: "Harbour Realty",
        decisionMakerName: "Aritri Shah",
      }],
    });
    expect(row.lead?.country).toBe("USA");
    expect(row.lead?.position).toBe("acting_broker");
    expect(row.lead?.status).toBe("not_interested");
    expect(row.duplicate?.reason).toBe("phone");
  });

  it("rejects a row that is missing the decision maker or a real country", () => {
    const result = validateLeadValues({
      brokerage_name: "Solo Office",
      position: "broker",
      country: "Mexico",
    });
    expect(result.lead).toBeNull();
    expect(result.errors.map((issue) => issue.code)).toEqual(expect.arrayContaining(["required", "country"]));
  });

  it("offers a header-only template that round-trips through the mapper", () => {
    const table = parseCsv(csvTemplate());
    expect(autoMapColumns(table[0]).decision_maker_name).toBe(0);
    expect(autoMapColumns(table[0]).brokerage_address).toBe(6);
    expect(applyMapping(table, autoMapColumns(table[0]))).toEqual([]);
  });
});

describe("agents cannot delete brokerage leads", () => {
  it("allows delete only for a superadmin", () => {
    expect(canDeleteLeads({ role: "agent" })).toBe(false);
    expect(canDeleteLeads({ role: "superadmin" })).toBe(true);
    expect(canEditLead({ role: "agent", agentId: "a" }, { createdByAgentId: "a" })).toBe(true);
    expect(canEditLead({ role: "agent", agentId: "a" }, { createdByAgentId: "b" })).toBe(false);
    expect(canEditLead({ role: "superadmin", agentId: null }, { createdByAgentId: "b" })).toBe(true);
  });

  it("rejects the delete in the server action before any database call", () => {
    const actions = read("app/admin/agent/leads/actions.ts");
    const server = read("lib/crm-leads/server.ts");
    expect(actions).toMatch(/if \(!actor \|\| !canDeleteLeads\(actor\)\) return/);
    expect(actions.indexOf("await deleteBrokerageLead")).toBeGreaterThan(actions.indexOf("!canDeleteLeads(actor)"));
    expect(server).toMatch(/if \(!canDeleteLeads\(actor\)\) return \{ ok: false, error: "forbidden" \}/);
    expect(server).toMatch(/rpc\("superadmin_delete_brokerage_lead"/);
    expect(server).not.toMatch(/\.delete\(/);
    expect(read("components/admin/crm/DeleteLeadButton.tsx")).toMatch(/deleteLeadAction/);
    expect(read("app/admin/agent/leads/[id]/page.tsx")).toMatch(/canDeleteLeads\(actor\)/);
  });

  it("enforces the no-delete rule in the database migration", () => {
    const sql = read("supabase/migrations/110_agent_crm_leads.sql");
    expect(sql).toMatch(/create table if not exists public\.brokerage_leads/);
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/before delete on public\.brokerage_leads/);
    expect(sql).toMatch(/Agents cannot delete brokerage leads/);
    expect(sql).toMatch(/app\.brokerage_lead_delete/);
    expect(sql).toMatch(/superadmin_delete_brokerage_lead/);
    expect(sql).toMatch(/revoke all on function public\.superadmin_delete_brokerage_lead\(uuid\) from public, anon, authenticated/);
    expect(sql).toMatch(/grant select, insert, update on table public\.brokerage_leads to service_role/);
    expect(sql).not.toMatch(/grant delete/i);
    expect(sql).not.toMatch(/drop table/i);
    expect(sql).toMatch(/leads-crm/);
    expect(sql).toMatch(/privileges \|\| array\['leads-crm'\]/);
  });

  it("gates the CRM route and turns the privilege on for new agents", () => {
    expect(AGENT_SCOPE_LABELS["leads-crm"]).toBe("Leads (CRM)");
    expect(read("components/admin/agents/AgentForm.tsx")).toMatch(/privileges: \["leads-crm"\]/);
    const withCrm = agent(["leads-crm"]);
    const without = agent(["mapsites"]);
    expect(accountCanAccessAdminPath(withCrm, "/admin/agent/leads")).toBe(true);
    expect(accountCanAccessAdminPath(withCrm, "/admin/agent/leads/import")).toBe(true);
    expect(accountCanAccessAdminPath(without, "/admin/agent/leads")).toBe(false);
    expect(accountCanAccessAdminPath(without, "/admin/leads")).toBe(false);
    expect(accountHasAdminScope(withCrm, "leads-crm")).toBe(true);
    expect(getAdminNavItems(withCrm).map((item) => item.href)).toContain("/admin/agent/leads");
    expect(getAdminNavItems(without).map((item) => item.href)).not.toContain("/admin/agent/leads");
    const global: AdminAccount = { name: "Arun", fastCode: "ARUN", email: null, access: "global" };
    expect(accountCanAccessAdminPath(global, "/admin/agent/leads")).toBe(true);
    expect(getAdminNavItems(global).map((item) => item.href)).toContain("/admin/agent/leads");
  });

  it("has matching English and German copy", () => {
    const walk = (a: unknown, b: unknown, path = ""): string[] => {
      if (typeof a === "string") return typeof b === "string" && b.trim() ? [] : [`${path} missing`];
      if (!a || typeof a !== "object") return [];
      const out: string[] = [];
      for (const key of Object.keys(a as object)) {
        out.push(...walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${path}.${key}`));
      }
      return out;
    };
    expect(walk(crmCopy("en"), crmCopy("de"))).toEqual([]);
  });
});
