import { describe, expect, it } from "vitest";
import {
  AGENT_ONLINE_WINDOW_MS,
  activityLabel,
  canEditNoteOn,
  chatPairKey,
  cleanFileName,
  formatIst,
  istDate,
  istDayEndUtc,
  istDayStartUtc,
  isAgentOnline,
  isValidDateString,
  messageTick,
  presenceLabel,
  redactActivityDetails,
  validateNoteFile,
} from "../lib/agent-collab";

describe("IST dates", () => {
  it("uses the India calendar day", () => {
    expect(istDate(new Date("2026-10-12T19:00:00Z"))).toBe("2026-10-13"); // 00:30 IST
    expect(istDate(new Date("2026-10-12T18:00:00Z"))).toBe("2026-10-12"); // 23:30 IST
  });
  it("computes UTC bounds for an IST day", () => {
    expect(istDayStartUtc("2026-10-12")).toBe("2026-10-11T18:30:00.000Z");
    expect(istDayEndUtc("2026-10-12")).toBe("2026-10-12T18:30:00.000Z");
  });
  it("validates date strings", () => {
    expect(isValidDateString("2026-10-12")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("12/10/2026")).toBe(false);
    expect(isValidDateString(undefined)).toBe(false);
  });
  it("formats with an IST label", () => {
    expect(formatIst("2026-10-12T11:48:00Z")).toMatch(/5:18\s?pm IST$/i);
    expect(formatIst(null)).toBe("—");
  });
});

describe("daily notes", () => {
  it("are editable only on their own IST day", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    expect(canEditNoteOn("2026-10-12", now)).toBe(true);
    expect(canEditNoteOn("2026-10-11", now)).toBe(false);
  });
  it("accepts documents within limits and rejects others", () => {
    expect(validateNoteFile({ name: "report.pdf", size: 1000 })).toMatchObject({ ok: true, mimeType: "application/pdf" });
    expect(validateNoteFile({ name: "photo.JPG", size: 1000 })).toMatchObject({ ok: true, mimeType: "image/jpeg" });
    expect(validateNoteFile({ name: "virus.exe", size: 10 }).ok).toBe(false);
    expect(validateNoteFile({ name: "page.html", size: 10 }).ok).toBe(false);
    expect(validateNoteFile({ name: "big.pdf", size: 11 * 1024 * 1024 }).ok).toBe(false);
    expect(validateNoteFile({ name: "empty.pdf", size: 0 }).ok).toBe(false);
  });
  it("cleans file names (no paths)", () => {
    expect(cleanFileName("../../etc/passwd")).toBe("passwd");
    expect(cleanFileName("C:\\x\\My <file>.pdf")).toBe("My _file_.pdf");
  });
});

describe("presence", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");
  it("is online only with a recent heartbeat and no later sign-out", () => {
    expect(isAgentOnline({ lastSeenAt: new Date(now - 10_000).toISOString(), signedOutAt: null }, now)).toBe(true);
    expect(isAgentOnline({ lastSeenAt: new Date(now - AGENT_ONLINE_WINDOW_MS - 1).toISOString(), signedOutAt: null }, now)).toBe(false);
    expect(
      isAgentOnline({ lastSeenAt: new Date(now - 10_000).toISOString(), signedOutAt: new Date(now - 5_000).toISOString() }, now),
    ).toBe(false);
    expect(isAgentOnline(null, now)).toBe(false);
  });
  it("labels last seen", () => {
    expect(presenceLabel(null)).toBe("Never signed in");
    expect(presenceLabel({ lastSeenAt: "2026-10-12T11:00:00Z", signedOutAt: null }, new Date(now))).toMatch(/^Last seen today 4:30/i);
    expect(presenceLabel({ lastSeenAt: "2026-10-10T11:00:00Z", signedOutAt: null }, new Date(now))).toMatch(/^Last seen 10 Oct 2026/);
  });
});

describe("chat", () => {
  it("computes sent / delivered / read ticks", () => {
    const at = "2026-10-12T12:00:00Z";
    expect(messageTick(at, null, null)).toBe("sent");
    expect(messageTick(at, "2026-10-12T11:59:00Z", null)).toBe("sent");
    expect(messageTick(at, "2026-10-12T12:00:05Z", null)).toBe("delivered");
    expect(messageTick(at, "2026-10-12T12:00:05Z", "2026-10-12T12:01:00Z")).toBe("read");
  });
  it("uses one conversation per pair regardless of order", () => {
    expect(chatPairKey("b", "a")).toBe(chatPairKey("a", "b"));
  });
  it("never surfaces chat content in activity details", () => {
    expect(redactActivityDetails({ fast_code: "rm22", message: "secret", chat_body: "x", content: "y" })).toEqual({ fast_code: "rm22" });
    expect(activityLabel("agent.logout")).toBe("Signed out");
  });
});

describe("chat privacy (static)", () => {
  it("keeps chat tables out of superadmin pages and the activity log code", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const path = await import("node:path");
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const n of readdirSync(dir)) {
        const f = path.join(dir, n);
        if (statSync(f).isDirectory()) walk(f, out);
        else if (/\.tsx?$/.test(n)) out.push(f);
      }
      return out;
    };
    for (const file of walk(path.join(process.cwd(), "app", "admin", "agents"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/agent_chat|readChatThread|listChatContacts/);
    }
    const server = readFileSync(path.join(process.cwd(), "lib", "chat", "server.ts"), "utf8");
    expect(server).not.toMatch(/logAgentAudit|from\("activity_logs"\)/);
  });
});
