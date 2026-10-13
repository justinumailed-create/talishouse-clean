import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canEditMessage,
  chatTick,
  cleanChatBody,
  dmPairKey,
  inboxTime,
  isAllowedReaction,
  isUuid,
  likePattern,
  makeLimiter,
  messagePreview,
  validateChatFile,
} from "../lib/chat/model";
import { shouldHidePublicStorefrontChrome } from "../lib/admin-paths";

const root = process.cwd();
const read = (...p: string[]) => readFileSync(path.join(root, ...p), "utf8");

describe("chat v2 model", () => {
  it("ticks: sent → delivered → read", () => {
    expect(chatTick({ deliveredAt: null, readAt: null })).toBe("sent");
    expect(chatTick({ deliveredAt: "2026-10-13T08:00:00Z", readAt: null })).toBe("delivered");
    expect(chatTick({ deliveredAt: "2026-10-13T08:00:00Z", readAt: "2026-10-13T08:01:00Z" })).toBe("read");
  });

  it("pair keys are order-independent", () => {
    expect(dmPairKey("b", "a")).toBe(dmPairKey("a", "b"));
  });

  it("validates ids, bodies, reactions and files", () => {
    expect(isUuid("7f44333d-2980-459e-94c0-11afb78b4db3")).toBe(true);
    expect(isUuid("x; drop")).toBe(false);
    expect(cleanChatBody("  hi\u0000 there \r\n")).toBe("hi there");
    expect(isAllowedReaction("👍")).toBe(true);
    expect(isAllowedReaction("<script>")).toBe(false);
    expect(validateChatFile({ name: "a.exe", size: 10 }).ok).toBe(false);
    expect(validateChatFile({ name: "photo.JPG", size: 10 })).toMatchObject({ ok: true, mimeType: "image/jpeg" });
    expect(validateChatFile({ name: "big.pdf", size: 11 * 1024 * 1024 }).ok).toBe(false);
    expect(validateChatFile({ name: "../../etc/x.pdf", size: 5 })).toMatchObject({ ok: true, fileName: "x.pdf" });
  });

  it("escapes LIKE wildcards in search", () => {
    expect(likePattern("50%_off")).toBe("%50\\%\\_off%");
  });

  it("only lets the author edit, within 24 hours, if not deleted", () => {
    const now = Date.parse("2026-10-13T10:00:00Z");
    expect(canEditMessage({ mine: true, deletedAt: null, createdAt: "2026-10-13T09:00:00Z" }, now)).toBe(true);
    expect(canEditMessage({ mine: false, deletedAt: null, createdAt: "2026-10-13T09:00:00Z" }, now)).toBe(false);
    expect(canEditMessage({ mine: true, deletedAt: "2026-10-13T09:30:00Z", createdAt: "2026-10-13T09:00:00Z" }, now)).toBe(false);
    expect(canEditMessage({ mine: true, deletedAt: null, createdAt: "2026-10-11T09:00:00Z" }, now)).toBe(false);
  });

  it("rate limiter trips after the max", () => {
    const limit = makeLimiter(2, 1000);
    expect(limit("a", 0)).toBe(false);
    expect(limit("a", 1)).toBe(false);
    expect(limit("a", 2)).toBe(true);
    expect(limit("a", 2000)).toBe(false);
  });

  it("previews and inbox times", () => {
    expect(messagePreview({ body: "", deletedAt: "x", fileName: null, ebookTitle: null })).toBe("Message deleted");
    expect(messagePreview({ body: "", deletedAt: null, fileName: "a.pdf", ebookTitle: null })).toContain("a.pdf");
    expect(inboxTime("2026-10-13T08:00:00Z", new Date("2026-10-13T10:00:00Z"))).toMatch(/pm|am/i);
    expect(inboxTime("2026-10-01T08:00:00Z", new Date("2026-10-13T10:00:00Z"))).toBe("1 Oct");
  });
});

describe("chat v2 wiring (static)", () => {
  it("runs outside the admin shell and storefront chrome", () => {
    expect(shouldHidePublicStorefrontChrome("/chat")).toBe(true);
    expect(shouldHidePublicStorefrontChrome("/chat/abc")).toBe(true);
    expect(existsSync(path.join(root, "app", "chat", "layout.tsx"))).toBe(true);
    expect(read("app", "chat", "layout.tsx")).not.toMatch(/AdminLayoutClient/);
  });

  it("redirects the old /admin/agent/chat page", () => {
    expect(read("app", "admin", "agent", "chat", "page.tsx")).toMatch(/redirect\("\/chat"\)/);
  });

  it("sends agents to chat after login when enabled", () => {
    expect(read("app", "agent", "actions.ts")).toMatch(/"\/chat"/);
  });

  it("checks membership before every conversation read/write", () => {
    const server = read("lib", "chat", "server.ts");
    for (const fn of ["sendMessage", "setTyping", "createChatUpload"]) {
      const body = server.slice(server.indexOf(`export async function ${fn}`));
      expect(body.slice(0, 600), fn).toMatch(/conversationFor\(me/);
    }
    // eBook cards are only created by someone with eBook access for that FAST Code.
    expect(server).toMatch(/canManageMapSiteEbooks\(fastCode\)/);
    // search is scoped to my conversations
    const search = server.slice(server.indexOf("export async function searchMessages"));
    expect(search.slice(0, 900)).toMatch(/eq\("member_id", me\.memberId\)/);
  });

  it("reads inbox and thread in one round trip, with membership enforced in SQL", () => {
    const server = read("lib", "chat", "server.ts");
    expect(server).toMatch(/rpc\("chat_inbox"/);
    expect(server).toMatch(/rpc\("chat_thread"/);
    const sql = read("supabase", "migrations", "106_chat_perf.sql");
    expect(sql).toMatch(/return null; -- not a participant/);
    expect(sql).toMatch(/revoke all on function public\.chat_thread[^;]*from public, anon, authenticated/);
    expect(sql).toMatch(/gin_trgm_ops/);
  });

  it("server-renders the first screen and polls only while visible", () => {
    expect(read("app", "chat", "load.ts")).toMatch(/Promise\.all\(\[\s*listInbox/);
    const client = read("components", "chat", "ChatApp.tsx");
    expect(client).toMatch(/useState<ChatThreadView \| null>\(initial\)/);
    expect(client).toMatch(/AbortSignal\.timeout/);
  });

  it("has no admin endpoint that reads other people's chats", () => {
    expect(read("app", "api", "chat", "route.ts")).toMatch(/getChatMe/);
    expect(existsSync(path.join(root, "app", "api", "agent", "chat"))).toBe(false);
  });

  it("ships a PWA manifest", () => {
    const m = JSON.parse(read("public", "chat.webmanifest"));
    expect(m.start_url).toBe("/chat");
    expect(m.display).toBe("standalone");
    expect(read("app", "chat", "layout.tsx")).toMatch(/chat\.webmanifest/);
  });

  it("migrations 101/102 keep RLS on and the bucket private", () => {
    const m101 = read("supabase", "migrations", "101_agent_chat_v2.sql");
    for (const t of ["chat_members", "agent_chat_reactions", "agent_chat_typing"]) {
      expect(m101).toMatch(new RegExp(`alter table public\\.${t} enable row level security`));
    }
    expect(read("supabase", "migrations", "102_agent_chat_files.sql")).toMatch(/false, 10485760/);
  });
});
