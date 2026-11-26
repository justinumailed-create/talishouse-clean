import { describe, expect, it, vi } from "vitest";
import {
  MEETING_BOTS,
  fetchBotMeetings,
  followUpsFrom,
  meetingCounts,
  parseMeeting,
  todosFrom,
  validateContact,
  type Meeting,
} from "@/lib/tsplits-meetings";
import { getAdminNavItems, getFullAdminNavItems } from "@/lib/admin-nav";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { getAdminAccountByFastCode, grantToAdminAccount, type AdminAccount } from "@/lib/admin-constants";

const AISHA = "agent_0401m7cxgba1fhwb35aqr43acnv1";
const WEBSTER = "agent_5701m7n1n436fzs98pnepf37gk3q";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function dc(values: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { data_collection_id: k, value: v, rationale: "x" }]));
}

const websterDetail = {
  conversation_id: "conv_w1",
  agent_id: WEBSTER,
  status: "done",
  metadata: { start_time_unix_secs: 1795100896, call_duration_secs: 166 },
  analysis: {
    call_successful: "success",
    call_summary_title: "Fractionalization Land Sale",
    transcript_summary: "Prospect wants to fractionalize land.",
    data_collection_results: dc({
      guide_outcome: "callback",
      callback_phone: "+1 (416) 555-0199",
      callback_time: "tomorrow 10am",
      structure_choice: "fractionalization",
      negotiation_requested: true,
    }),
  },
  transcript: [
    { role: "agent", message: "Got a project? Talk to me.", time_in_call_secs: 0 },
    { role: "agent", message: null, time_in_call_secs: 3 },
    { role: "user", message: "I have land to sell.", time_in_call_secs: 4 },
  ],
};

describe("validateContact", () => {
  it("accepts real phone numbers and emails", () => {
    expect(validateContact("+1 (416) 555-0199")).toEqual({ kind: "phone", value: "+1 (416) 555-0199" });
    expect(validateContact("my number is 98765 43210 thanks")?.kind).toBe("phone");
    expect(validateContact("ralf@example.com")).toEqual({ kind: "email", value: "ralf@example.com" });
    expect(validateContact("email me at a.b+c@mail.co.uk")?.value).toBe("a.b+c@mail.co.uk");
  });

  it("rejects junk like XYZ XYZ, short numbers and empty values", () => {
    for (const junk of ["XYZ XYZ", "12345", "555-1234", "", "   ", "abc@", "n/a", null, undefined, 42]) {
      expect(validateContact(junk)).toBeNull();
    }
  });
});

describe("parseMeeting", () => {
  it("reads metadata, analysis, data collection and transcript", () => {
    const m = parseMeeting("webster", websterDetail);
    expect(m.id).toBe("conv_w1");
    expect(m.startUnix).toBe(1795100896);
    expect(m.durationSecs).toBe(166);
    expect(m.summary).toContain("fractionalize");
    expect(m.fields.structure_choice).toBe("fractionalization");
    expect(m.fields.negotiation_requested).toBe(true);
    expect(m.callbackTime).toBe("tomorrow 10am");
    expect(m.validContact?.kind).toBe("phone");
    expect(m.transcript).toHaveLength(2);
    expect(m.transcript[1]).toEqual({ role: "user", message: "I have land to sell.", timeInCallSecs: 4 });
  });

  it("accepts the list form of data collection and keeps junk contacts invalid", () => {
    const m = parseMeeting("aisha", {
      conversation_id: "conv_a1",
      analysis: {
        data_collection_results_list: [
          { data_collection_id: "caller_name", value: "Ralf" },
          { data_collection_id: "contact", value: "XYZ XYZ" },
          { data_collection_id: "account_type_interest", value: "Agent" },
        ],
      },
    });
    expect(m.callerName).toBe("Ralf");
    expect(m.contactRaw).toBe("XYZ XYZ");
    expect(m.validContact).toBeNull();
    expect(m.fields.account_type_interest).toBe("Agent");
  });
});

describe("fetchBotMeetings", () => {
  it("shows a not-set-up state without an API key and never calls fetch", async () => {
    const fetchImpl = vi.fn();
    const r = await fetchBotMeetings("aisha", { apiKey: "", fetchImpl });
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.reason).toBe("missing-key");
    expect(r.ok ? "" : r.message).toMatch(/isn’t set up yet/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lists the bot's conversations, fetches details read-only, newest first", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)["xi-api-key"]).toBe("test-key");
      expect(init?.method ?? "GET").toBe("GET");
      if (url.includes("/v1/convai/conversations?")) {
        expect(url).toContain(`agent_id=${WEBSTER}`);
        expect(url).toContain("page_size=50");
        return json({
          conversations: [
            { conversation_id: "conv_old", start_time_unix_secs: 100, call_duration_secs: 10 },
            { conversation_id: "conv_w1", start_time_unix_secs: 1795100896 },
          ],
        });
      }
      if (url.endsWith("/conv_w1")) return json(websterDetail);
      return json({}, 500);
    });
    const r = await fetchBotMeetings("webster", { apiKey: "test-key", fetchImpl });
    expect(r.ok).toBe(true);
    expect(r.meetings.map((m) => m.id)).toEqual(["conv_w1", "conv_old"]);
    // A failed detail call still keeps the row from the list.
    expect(r.meetings[1].durationSecs).toBe(10);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("reports an error state when the list call fails", async () => {
    const r = await fetchBotMeetings("aisha", { apiKey: "k", fetchImpl: async () => json({ detail: "no" }, 401) });
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.reason).toBe("error");
  });

  it("targets the live Aisha and Webster agents", () => {
    expect(MEETING_BOTS.aisha.agentId).toBe(AISHA);
    expect(MEETING_BOTS.webster.agentId).toBe(WEBSTER);
  });
});

describe("follow ups, to-dos and counts", () => {
  const good = parseMeeting("webster", websterDetail);
  const junk: Meeting = { ...good, id: "conv_junk", validContact: null, contactRaw: "XYZ XYZ", fields: { guide_outcome: "callback" } };
  const aisha = parseMeeting("aisha", {
    conversation_id: "conv_a2",
    metadata: { start_time_unix_secs: 1795200000 },
    analysis: { data_collection_results: dc({ caller_name: "Sam", contact: "sam@example.com" }) },
  });

  it("keeps only calls with a valid contact, newest first", () => {
    expect(followUpsFrom([good, junk, aisha]).map((m) => m.id)).toEqual(["conv_a2", "conv_w1"]);
  });

  it("derives callbacks and negotiation to-dos", () => {
    const kinds = todosFrom([good, junk, aisha]).map((t) => `${t.meeting.id}:${t.kind}`);
    // The junk-contact callback ("XYZ XYZ") produces no to-do.
    expect(kinds).toEqual(["conv_a2:callback", "conv_w1:callback", "conv_w1:negotiation"]);
  });

  it("counts calls today (IST) and in the last 7 days", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    const t = now.getTime() / 1000;
    const ms = [t - 3600, t - 3 * 86400, t - 30 * 86400].map((s, i) => ({ ...good, id: String(i), startUnix: s }));
    expect(meetingCounts(ms, now)).toEqual({ today: 1, week: 2 });
  });
});

describe("admin nav follows the call flow", () => {
  const FLOW = ["/admin/dashboard", "/admin/meetings/aisha", "/admin/meetings/webster", "/admin/follow-ups", "/admin/todos"];

  it("shows the Global Admin only the five flow items, in order", () => {
    const items = getAdminNavItems(getAdminAccountByFastCode("ARUN"));
    expect(items.map((i) => i.href)).toEqual(FLOW);
    expect(items.map((i) => i.label)).toEqual(["Dashboard", "Meetings by Aisha", "Meetings by Webster", "Follow Ups", "To-dos"]);
  });

  it("shows granted admins the same five and keeps hidden routes reachable by scope", () => {
    const seoOnly = grantToAdminAccount({ fastCode: "AB12", displayName: null, permissions: ["seo"] });
    expect(getAdminNavItems(seoOnly).map((i) => i.href)).toEqual(FLOW);
    expect(accountCanAccessAdminPath(seoOnly, "/admin/seo")).toBe(true);
    expect(accountCanAccessAdminPath(seoOnly, "/admin/mapsites")).toBe(false);
    expect(getFullAdminNavItems(seoOnly).map((i) => i.href)).toContain("/admin/seo");
  });

  it("gives Associate Admins their dashboard and To-dos, but not the call pages", () => {
    const agent: AdminAccount = { name: "A", fastCode: "", email: null, access: "agent", scopes: ["mapsites", "leads-crm"], agentId: "x" };
    expect(getAdminNavItems(agent)).toEqual([
      { href: "/admin/agent", label: "Dashboard" },
      { href: "/admin/agent/notes", label: "To-dos" },
    ]);
    for (const p of ["/admin/meetings/aisha", "/admin/follow-ups", "/admin/todos"]) {
      expect(accountCanAccessAdminPath(agent, p)).toBe(false);
      expect(accountCanAccessAdminPath(getAdminAccountByFastCode("ARUN"), p)).toBe(true);
    }
  });
});
