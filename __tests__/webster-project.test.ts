import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import { indexablePageRoutes } from "../lib/seo/indexable-routes";
import {
  WEBSTER_PROJECT_AGENT_ID,
  WEBSTER_PROJECT_PATH,
  isRegistrationOfferHref,
  websterOneHref,
  websterProjectHref,
} from "../lib/talispros/webster-project";
import { addUserLine, appendPlayedChars } from "../lib/talispros/spoken-transcript";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Webster TWO", () => {
  it("opens the project agent with the code and does not replace Webster ONE", () => {
    expect(WEBSTER_PROJECT_AGENT_ID).toBe("agent_5701m7n1n436fzs98pnepf37gk3q");
    expect(websterProjectHref("DC06")).toBe("/webster/project?call=1&code=DC06");
    expect(websterProjectHref("")).toBe("/webster/project?call=1");
    expect(websterOneHref("DC06")).toBe("/webster?call=1&code=DC06");
    expect(websterOneHref("")).toBe("/webster?call=1");
    expect(isRegistrationOfferHref("/webster?call=1")).toBe(true);
    expect(isRegistrationOfferHref("/register")).toBe(true);
    expect(isRegistrationOfferHref("/talispros/markets/claim-a-market")).toBe(true);
    expect(isRegistrationOfferHref("/webster/project?call=1")).toBe(false);
    expect(en.home.assistants.webster.projectIntro).toBe(
      "Got a project? Talk to me. I'm Webster, your Fulfilment Manager…!",
    );
    expect(de.home.assistants.webster.projectIntro).toBe(
      "Haben Sie ein Projekt? Sprechen Sie mit mir. Ich bin Webster, Ihr Fulfilment Manager…!",
    );
    expect(read("app/webster/project/page.tsx")).toContain("heading={copy.projectIntro}");
    expect(read("app/webster/page.tsx")).toContain("copy.panelTitle");
    expect(en.home.conversation.describeProject).toBe("Describe your project with Webster");
    expect(de.home.conversation.describeProject).toBe("Beschreiben Sie Ihr Projekt mit Webster");
    expect(en.home.conversation.describeProject).not.toMatch(/—|–/);
    expect(de.home.conversation.describeProject).not.toMatch(/—|–/);
    const discuss = read("components/talisu/DiscussProjectClient.tsx");
    expect(discuss).toContain("/webster?call=1");
    expect(discuss).not.toContain(WEBSTER_PROJECT_PATH);
    expect(indexablePageRoutes()).not.toContain(WEBSTER_PROJECT_PATH);
    const linked = [
      "components/Header.tsx",
      "components/Footer.tsx",
      "components/talisu/TalisUMktsHeader.tsx",
    ].map(read).join("\n");
    expect(linked).not.toContain(WEBSTER_PROJECT_PATH);
    expect(read("app/home/[fastCode]/page.tsx")).toContain("websterProjectHref");
    expect(read("components/talispros/mapsite/MapSiteApplication.tsx")).toContain("describe-project-webster");
  });

  it("shows a visitor line immediately and keeps agent audio unplayed until chars arrive", () => {
    const withUser = addUserLine([], "Hello there");
    expect(withUser).toEqual([{ id: "user-0", role: "user", text: "Hello there" }]);
    const first = appendPlayedChars([], "Hi", false);
    expect(first.turnOpen).toBe(true);
    expect(first.lines[0]?.text).toBe("Hi");
    const more = appendPlayedChars(first.lines, " there", true);
    expect(more.lines).toHaveLength(1);
    expect(more.lines[0]?.text).toBe("Hi there");
    const next = appendPlayedChars(more.lines, "Next", false);
    expect(next.lines).toHaveLength(2);
    expect(next.lines[1]?.text).toBe("Next");
  });
});
