import { NextResponse, type NextRequest } from "next/server";
import {
  countChatUnread,
  createChatUpload,
  deleteMessage,
  editMessage,
  getChatIdentity,
  getChatMe,
  listInbox,
  openDm,
  readThread,
  searchMessages,
  sendMessage,
  setChatOnLogin,
  setPinned,
  setTyping,
  toggleReaction,
  type ChatResult,
} from "@/lib/chat/server";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

function result(r: ChatResult<unknown>) {
  return r.ok ? json({ ok: true, value: r.value ?? null }) : json({ ok: false, error: r.error }, 400);
}

/** GET ?view=inbox | ?view=thread&c=<id>[&read=0] | ?view=search&q= — each read is one DB round trip. */
export async function GET(request: NextRequest) {
  const t0 = performance.now();
  const id = await getChatIdentity();
  const tAuth = performance.now() - t0;
  if (!id) return json({ error: "Unauthorized" }, 401);
  const p = request.nextUrl.searchParams;
  const view = p.get("view") ?? "inbox";
  const timed = (body: unknown, status = 200) => {
    const res = json(body, status);
    res.headers.set("Server-Timing", `auth;dur=${tAuth.toFixed(0)}, db;dur=${(performance.now() - t0 - tAuth).toFixed(0)}, total;dur=${(performance.now() - t0).toFixed(0)}`);
    return res;
  };
  try {
    if (view === "inbox") return timed({ items: await listInbox(id) });
    if (view === "thread") {
      const thread = await readThread(id, p.get("c") ?? "", p.get("read") !== "0");
      return thread ? timed({ thread }) : timed({ error: "Not found" }, 404);
    }
    if (view === "search") {
      const me = await getChatMe();
      return me ? result(await searchMessages(me, p.get("q"))) : json({ error: "Unauthorized" }, 401);
    }
  } catch (err) {
    console.error("[api/chat] GET failed", view, err);
    return timed({ error: "Chat is temporarily unavailable." }, 503);
  }
  return json({ error: "Bad request" }, 400);
}

export async function POST(request: NextRequest) {
  const me = await getChatMe();
  if (!me) return json({ error: "Unauthorized" }, 401);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) return json({ error: "Forbidden" }, 403);
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const c = String(b.conversationId ?? "");
  switch (b.op) {
    case "ping":
      return json({ ok: true, unread: await countChatUnread(me.memberId) });
    case "open":
      return result(await openDm(me, String(b.peerMemberId ?? "")));
    case "send":
      return result(await sendMessage(me, c, {
        body: b.body,
        replyToId: b.replyToId,
        filePath: b.filePath,
        ebook: (b.ebook as { fastCode?: unknown; bookId?: unknown } | null) ?? null,
      }));
    case "edit":
      return result(await editMessage(me, b.messageId, b.body));
    case "delete":
      return result(await deleteMessage(me, b.messageId));
    case "pin":
      return result(await setPinned(me, b.messageId, b.pinned !== false));
    case "react":
      return result(await toggleReaction(me, b.messageId, b.emoji));
    case "typing":
      return result(await setTyping(me, c));
    case "upload":
      return result(await createChatUpload(me, c, { name: b.name, size: b.size }));
    case "prefs":
      return result(await setChatOnLogin(me, b.chatOnLogin !== false));
    default:
      return json({ error: "Bad request" }, 400);
  }
}
