import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AdminAccount } from "@/lib/admin-constants";
import { adminChrome } from "@/lib/admin-chrome";
import {
  activityStreak,
  canCommentOnFlow,
  canEditFlowLead,
  checkpointOpenedBy,
  compareNextAction,
  countryFromProvince,
  earnedBadges,
  externalBrokerageWebsite,
  flowAccess,
  isStepUnlocked,
  nextActionOf,
  nextStepKey,
  pointsForSteps,
  progressPercent,
  rankLeaderboard,
  resolveBrokerageWebsite,
  type SavedStep,
} from "@/lib/talispros/call-flow";
import { buildStepViews } from "@/lib/talispros/call-flow-copy";

describe("admin console chrome", () => {
  it("translates the agent and admin shell when the locale is German", () => {
    const de = adminChrome("de");
    const en = adminChrome("en");
    expect(de.agentConsole).toBe("Agentenkonsole");
    expect(de.adminConsole).toBe("Adminkonsole");
    expect(de.logout).toBe("Abmelden");
    expect(de.nav("/admin/agent", "My dashboard")).toBe("Mein Dashboard");
    expect(de.nav("/admin/agent/notes", "Daily notes")).toBe("Tagesnotizen");
    expect(de.nav("/admin/leads", "Leads")).toBe("Interessenten");
    expect(de.nav("/admin/agent/review", "Review")).toBe("Prüfung");
    expect(de.group("Workspace")).toBe("Arbeitsbereich");
    expect(en.nav("/admin/mapsites", "Mapsites")).toBe("Mapsites");
    expect(de.nav("/admin/mapsites", "Mapsites")).toBe("Mapsites");
    expect(de.nav("/admin/seo", "SEO")).toBe("SEO");
    const layout = readFileSync(resolve("components/admin/AdminLayoutClient.tsx"), "utf8");
    expect(layout).toContain("useLocale");
    expect(layout).toContain("adminChrome");
    expect(layout).toContain("Tsplits™ home");
    const tracker = readFileSync(resolve("components/admin/FastCodesTracker.tsx"), "utf8");
    expect(tracker).toContain('data-testid="fast-codes-cards"');
    expect(tracker).toContain("md:hidden");
    expect(tracker).toContain("t.checkpoint");
    expect(tracker.indexOf("fast-codes-cards")).toBeLessThan(tracker.indexOf("fast-codes-table"));
  });
});

function saved(step: SavedStep["step"], outcome: SavedStep["outcome"] = "continue"): SavedStep {
  return { step, outcome, response: "They agreed.", at: "2026-11-05T04:30:00.000Z" };
}

const vars = {
  firstName: "Sam",
  agentName: "Aritri",
  brokerage: "Lakeside Realty",
  town: "Kingston",
  position: "broker",
  fastCode: "LS01",
  mapsiteUrl: "/talispros/mapsite/root/ls01",
  tebUrl: "/talisbooks/fast/ls01",
  registerUrl: "/talisu/reg?fastCode=LS01",
  agentCount: 8,
};

describe("call flow lock and scoring", () => {
  it("keeps later steps locked until a continue response is saved", () => {
    expect(isStepUnlocked("opener", [])).toBe(true);
    expect(isStepUnlocked("hook", [])).toBe(false);
    expect(isStepUnlocked("hook", [saved("opener")])).toBe(true);
    expect(isStepUnlocked("how", [saved("opener", "not_interested")])).toBe(false);
    expect(nextStepKey([saved("opener"), saved("hook")])).toBe("how");
    expect(nextStepKey(Array.from({ length: 7 }, (_, i) => saved(["opener", "hook", "how", "walkthrough", "value", "time", "register"][i] as SavedStep["step"])))).toBe("done");
  });

  it("orders leads by the next unfinished step, then the oldest touch", () => {
    const fresh = nextActionOf([], "");
    const hooked = nextActionOf([saved("opener")], "2026-11-05T04:30:00.000Z");
    const stopped = nextActionOf([saved("opener", "not_interested")], "2026-11-01T00:00:00.000Z");
    expect(compareNextAction(fresh, hooked)).toBeLessThan(0);
    expect(compareNextAction(hooked, stopped)).toBeLessThan(0);
  });

  it("scores points, progress, streaks and badges", () => {
    const rows = [saved("opener"), saved("hook"), saved("walkthrough")];
    expect(pointsForSteps(rows)).toBe(30);
    expect(pointsForSteps([...rows, saved("register")])).toBe(55);
    expect(progressPercent(rows)).toBe(43);
    expect(earnedBadges(rows)).toEqual(["first_call", "first_demo"]);
    expect(earnedBadges([saved("register")])).toEqual(["first_registration"]);
    expect(activityStreak(["2026-11-03T04:00:00.000Z", "2026-11-04T04:00:00.000Z", "2026-11-05T04:00:00.000Z"], new Date("2026-11-05T12:00:00.000Z"))).toBe(3);
    expect(activityStreak(["2026-11-03T04:00:00.000Z"], new Date("2026-11-05T12:00:00.000Z"))).toBe(0);
  });

  it("opens the three review checkpoints on the playbook steps", () => {
    expect(checkpointOpenedBy("opener", "not_interested")).toBe("after_first_contact");
    expect(checkpointOpenedBy("walkthrough", "continue")).toBe("after_demo");
    expect(checkpointOpenedBy("time", "continue")).toBe("before_registration");
    expect(checkpointOpenedBy("hook", "continue")).toBeNull();
  });

  it("ranks Aritri and Enanko by points", () => {
    expect(rankLeaderboard([
      { loginId: "enanko", points: 20 },
      { loginId: "aritri", points: 40 },
    ]).map((row) => row.loginId)).toEqual(["aritri", "enanko"]);
  });
});

describe("call flow copy", () => {
  it("speaks as the agent, in CAD and kilometres, with no calling persona", () => {
    for (const locale of ["en", "de"] as const) {
      const steps = buildStepViews(locale, vars, []);
      const text = JSON.stringify(steps);
      expect(text).toContain("Aritri");
      expect(text).toContain("Lakeside Realty");
      expect(text).toContain("Tsplits™");
      expect(text).not.toMatch(/Aisha/i);
      expect(text).not.toMatch(/Mapsite™/);
      expect(text).not.toMatch(/\bUSD\b|\bmiles?\b|TODO|lorem/i);
      expect(steps[0]?.locked).toBe(false);
      expect(steps[1]?.locked).toBe(true);
      expect(steps[1]?.script).toBe("");
    }
    const en = buildStepViews("en", vars, [saved("opener")]);
    expect(en[1]?.script).toMatch(/revenue-producing/);
    expect(en[1]?.script).not.toMatch(/selling|offering/i);
    expect(en.find((step) => step.key === "value")?.goal).toMatch(/80 kilometres/);
    expect(en.find((step) => step.key === "value")?.goal).toMatch(/CAD/);
    const open = buildStepViews("en", vars, ["opener", "hook", "how", "walkthrough", "value", "time"].map((step) => saved(step as SavedStep["step"])));
    expect(open.find((step) => step.key === "register")?.script).toMatch(/\/talisu\/reg/);
    const de = buildStepViews("de", { ...vars, agentName: "Enanko" }, [saved("opener")]);
    expect(de[0]?.script).toContain("Enanko");
    expect(de[1]?.script).toMatch(/einnahmen/i);
  });

  it("keeps the playbook lines in the source files", () => {
    const copy = readFileSync(resolve("lib/talispros/call-flow-copy.ts"), "utf8");
    expect(copy).toMatch(/advertising budget revenue-producing/);
    expect(copy).toMatch(/industry-adjacent platforms we call Mapsites/);
    expect(copy).not.toMatch(/Aisha/);
  });
});

describe("reviewer access", () => {
  const reviewer: AdminAccount = {
    name: "Agent Arun",
    fastCode: "@arun",
    email: null,
    access: "agent",
    scopes: [],
    agentId: "arun-id",
    reviewer: true,
  };
  const agent: AdminAccount = { ...reviewer, name: "Aritri", reviewer: false, agentId: "aritri-id" };
  const ralf: AdminAccount = {
    name: "Ralf",
    fastCode: "RM22",
    email: null,
    access: "granted",
    scopes: ["agents", "fast-codes", "dashboard"],
  };

  it("lets Agent Arun view and comment without edit or admin power", () => {
    expect(flowAccess(reviewer)).toBe("reviewer");
    expect(canCommentOnFlow("reviewer")).toBe(true);
    expect(canEditFlowLead("reviewer", "arun-id", "aritri-id")).toBe(false);
    expect(canEditFlowLead("agent", "aritri-id", "aritri-id")).toBe(true);
    expect(canEditFlowLead("agent", "aritri-id", "enanko-id")).toBe(false);
    expect(flowAccess(ralf)).toBe("admin");
    expect(canCommentOnFlow(flowAccess(ralf)!)).toBe(true);
    expect(agent.scopes).not.toContain("agents");
  });

  it("keeps a real brokerage site and rejects an internal Mapsite path", () => {
    expect(externalBrokerageWebsite("/talispros/register-your-mapsite/ys01")).toBeNull();
    expect(externalBrokerageWebsite("https://www.talispros.com/talispros/register-your-mapsite/ys01")).toBeNull();
    const real = externalBrokerageWebsite("https://grassrootsrealtygroup.ca/location/canmore/");
    expect(real).toMatch(/^https:\/\/grassrootsrealtygroup\.ca\//);
    expect(resolveBrokerageWebsite("https://example-broker.ca", "/talispros/register-your-mapsite/ys01")).toMatch(/^https:\/\/example-broker\.ca\/?$/);
    expect(resolveBrokerageWebsite("/talispros/register-your-mapsite/ys01", null, "https://grassrootsrealtygroup.ca/location/canmore/")).toMatch(/grassrootsrealtygroup\.ca/);
  });

  it("treats unknown provinces as Canada", () => {
    expect(countryFromProvince("ON")).toBe("Canada");
    expect(countryFromProvince("NY")).toBe("USA");
    expect(countryFromProvince("")).toBe("Canada");
  });
});
