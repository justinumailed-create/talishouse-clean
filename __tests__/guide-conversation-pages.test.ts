import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import { indexablePageRoutes } from "../lib/seo/indexable-routes";
import { AISHA_HOMEPAGE_AGENT_ID, AISHA_MAPSITE_AGENT_ID } from "../lib/talispros/aisha-mapsite-agent";
import {
  ASSISTANT_PERSONAS,
  THORSTEN_GUIDE_AGENT_ID,
  WEBSTER_GUIDE_AGENT_ID,
} from "../lib/talispros/assistant-personas";
import { GUIDE_CONVERSATION_PATHS } from "../lib/talispros/guide-pages";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("unlisted Webster and Thorsten guide pages", () => {
  it("uses their own agents and the shared conversation layout", () => {
    expect(WEBSTER_GUIDE_AGENT_ID).toBe("agent_0701m7kv74mnf12btd49nv64t3cg");
    expect(THORSTEN_GUIDE_AGENT_ID).toBe("agent_6201m7kv77zrebbvf0zj11cnrwt0");
    expect(ASSISTANT_PERSONAS.webster.agentId).toBe(WEBSTER_GUIDE_AGENT_ID);
    expect(ASSISTANT_PERSONAS.thorsten.agentId).toBe(THORSTEN_GUIDE_AGENT_ID);
    expect(ASSISTANT_PERSONAS.webster.portraitSrc).toBe("/talisu/webster-banker-v3.jpg");
    expect(ASSISTANT_PERSONAS.thorsten.portraitSrc).toBe("/talisu/webster-team-leader-v2.jpg");
    expect(ASSISTANT_PERSONAS.aisha.agentId).toBe(AISHA_HOMEPAGE_AGENT_ID);

    const layout = read("components/talispros/GuideConversationPage.tsx");
    expect(layout).toContain('embed="inline"');
    expect(layout).toContain("autoStart={call}");
    expect(layout).not.toContain("placement=");

    for (const [id, agentId] of [
      ["webster", WEBSTER_GUIDE_AGENT_ID],
      ["thorsten", THORSTEN_GUIDE_AGENT_ID],
    ] as const) {
      const page = read(`app/talispros/${id}/page.tsx`);
      expect(page).toContain("<GuideConversationPage");
      expect(page).toContain(`ASSISTANT_PERSONAS.${id}`);
      expect(page).toContain("guideDynamicVariables(query.code)");
      expect(page).toContain("noindex: true");
      expect(page).not.toContain("<AishaConvaiWidget");
      expect(page).not.toContain(AISHA_HOMEPAGE_AGENT_ID);
      expect(page).not.toContain(AISHA_MAPSITE_AGENT_ID);
      expect(page).not.toContain(agentId === WEBSTER_GUIDE_AGENT_ID ? THORSTEN_GUIDE_AGENT_ID : WEBSTER_GUIDE_AGENT_ID);
    }
  });

  it("stays out of the nav, footer, and sitemap", () => {
    const linked = [
      "components/Header.tsx",
      "components/Footer.tsx",
      "components/talisu/TalisUMktsHeader.tsx",
      "components/talispros/TalisprosFooter.tsx",
    ].map(read).join("\n");
    expect(linked).not.toContain("/talispros/webster");
    expect(linked).not.toContain("/talispros/thorsten");
    const routes = indexablePageRoutes();
    expect(routes).not.toContain("/talispros/webster");
    expect(routes).not.toContain("/talispros/thorsten");
    expect(GUIDE_CONVERSATION_PATHS).toContain("/talispros/webster");
    expect(GUIDE_CONVERSATION_PATHS).toContain("/talispros/thorsten");
    expect(read("components/talispros/TalisprosLayoutClient.tsx")).toContain("isGuideConversationPath");
  });

  it("uses short English and German headings without a trademark on the guide name", () => {
    expect(en.home.assistants.webster.title).toBe("Webster, Tsplits Guide");
    expect(de.home.assistants.webster.title).toBe("Webster, Tsplits-Guide");
    expect(en.home.assistants.thorsten.title).toBe("Thorsten, Tsplits Guide");
    expect(de.home.assistants.thorsten.title).toBe("Thorsten, Tsplits-Guide");
    for (const copy of [
      en.home.assistants.webster,
      en.home.assistants.thorsten,
      de.home.assistants.webster,
      de.home.assistants.thorsten,
    ]) {
      const text = Object.values(copy).join(" ");
      expect(text).not.toMatch(/—|Mapsite™|FAST Code™/);
    }
    expect(read("lib/talispros/guide-mapsite.ts")).toContain("aishaMapsiteDynamicVariables");
    expect(read("lib/talispros/guide-mapsite.ts")).toContain("if (!fast) return undefined");
  });
});
