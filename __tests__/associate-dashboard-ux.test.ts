import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leadDraftChanges, mergeLeadDraft, ASSOCIATE_LEAD_DRAFT_SCOPE } from "@/lib/talispros/lead-form-draft";
import { formDraftKey } from "@/lib/talispros/form-drafts";
import type { LeadFormState } from "@/lib/talispros/call-flow-server";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const baseLead: LeadFormState = {
  id: "lead-1",
  decisionMakerName: "Jonathan",
  position: "broker",
  cellPhone: "",
  email: "",
  brokerageName: "Exit Realty",
  brokerageWebsite: "",
  brokerageAddress: "",
  officePhone: "",
  country: "Canada",
  market: "",
  town: "Sydney",
  agentCount: "",
  source: "",
  notes: "",
};

describe("Associate Dashboard polish", () => {
  const dashboard = read("components/admin/agents/AgentDashboard.tsx");

  it("adds a colored, numbered Start here sequence with in-page navigation", () => {
    expect(dashboard).toContain('data-testid="associate-start-steps"');
    expect(dashboard).toContain("ASSOCIATE_START_STEPS.map");
    for (const anchor of ["#agent-lead-list", "#agent-tasks", "#agent-quick-links"]) {
      expect(dashboard).toContain(`href: "${anchor}"`);
    }
    expect(dashboard).toContain('id="agent-tasks"');
    expect(dashboard).toContain('id="agent-quick-links"');
    expect(read("components/admin/agents/CallFlowPanels.tsx")).toContain('id="agent-lead-list"');
    for (const color of ["bg-[#1E4ED8] text-white", "bg-amber-500 text-white", "bg-emerald-600 text-white"]) {
      expect(dashboard).toContain(color);
    }
  });

  it("color-codes the task cards instead of identical white panels", () => {
    const work = read("components/admin/agents/AgentWorkPanel.tsx");
    expect(work).toContain("TASK_CARD_ACCENTS");
    expect(work).toContain("border-t-4");
    for (const icon of ["map", "book", "pin", "cash"]) {
      expect(work).toMatch(new RegExp(`\\b${icon}: \\{ border: "border-t-`));
    }
  });

  it("shows a Logout button for signed-in associates (not in read-only preview)", () => {
    expect(dashboard).toContain("<AssociateLogoutButton");
    expect(dashboard).toMatch(/readOnly \? null : \(\s*<AssociateLogoutButton/);
    const button = read("components/admin/agents/AssociateLogoutButton.tsx");
    expect(button).toContain("logoutAdminAction");
    expect(button).toContain("clearAdminSession()");
    expect(button).toContain("router.replace(agentLoginPath())");
    expect(button).toContain('data-testid="associate-logout"');
  });

  it("has no em dash placeholders in the dashboard copy", () => {
    expect(dashboard).not.toContain('"—"');
    expect(read("components/admin/agents/AgentWorkPanel.tsx")).not.toContain("—");
  });

  it("keeps the DAR-18 portal routes and DAR-19 transcript routing untouched", () => {
    const page = read("app/admin/agent/page.tsx");
    expect(page).toContain("AISHA_TRANSCRIPTS_SCOPE");
    expect(page).toContain("listRoutedAishaTranscripts");
    expect(page).toContain('agentLoginPath("/admin/agent")');
    expect(read("lib/agent-return-path.ts")).toContain('AGENT_LOGIN_PATH = "/associate"');
  });
});

describe("Associate lead form drafts", () => {
  it("keys drafts per FAST Code", () => {
    expect(formDraftKey(ASSOCIATE_LEAD_DRAFT_SCOPE, "DC06")).toBe("tsplits:draft:associate-lead:dc06");
  });

  it("stores only unsaved changes and restores them safely", () => {
    const edited = { ...baseLead, notes: "Call back Friday", position: "team_leader" as const };
    const changes = leadDraftChanges(baseLead, edited);
    expect(changes).toEqual({ notes: "Call back Friday", position: "team_leader" });
    expect(mergeLeadDraft(baseLead, changes)).toEqual(edited);
  });

  it("ignores invalid positions, countries, ids and non-string values", () => {
    const merged = mergeLeadDraft(baseLead, {
      position: "ceo",
      country: "Mars",
      id: "other",
      agentCount: 12,
      town: "Halifax",
    });
    expect(merged.position).toBe("broker");
    expect(merged.country).toBe("Canada");
    expect(merged.id).toBe("lead-1");
    expect(merged.agentCount).toBe("");
    expect(merged.town).toBe("Halifax");
  });

  it("restores after hydration and clears on save", () => {
    const lead = read("components/admin/agents/LeadCrmClient.tsx");
    expect(lead).toContain("readFormDraft(draftKey)");
    expect(lead).toContain("writeFormDraft(draftKey, leadDraftChanges(bundle.lead, lead))");
    expect(lead).toMatch(/if \(res\.ok\) \{\s*clearFormDraft\(draftKey\)/);
    expect(lead).toContain('data-testid="lead-draft-restored"');
  });
});
