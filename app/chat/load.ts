import { redirect } from "next/navigation";
import { getChatIdentity, getChatOnLogin, listInbox, readThread, type ChatThreadView, type InboxItem } from "@/lib/chat/server";
import type { ChatViewer } from "@/components/chat/ChatApp";

export interface ChatInitialData {
  viewer: ChatViewer;
  items: InboxItem[] | null;
  thread: ChatThreadView | null;
}

/**
 * Server-render the first screen: inbox + open conversation are fetched in
 * parallel (one DB round trip each) so the page arrives with real content
 * instead of skeletons that wait for client polling after hydration.
 */
export async function loadChat(conversationId: string | null): Promise<ChatInitialData> {
  const id = await getChatIdentity();
  if (!id) redirect("/agent/login");
  const [items, thread, chatOnLogin] = await Promise.all([
    listInbox(id).catch((err) => { console.error("[chat] inbox SSR failed", err); return null; }),
    conversationId ? readThread(id, conversationId, true).catch((err) => { console.error("[chat] thread SSR failed", err); return null; }) : Promise.resolve(null),
    id.agentId ? getChatOnLogin(id.agentId) : Promise.resolve(null),
  ]);
  return {
    viewer: {
      memberId: id.agentId ?? id.adminCode ?? "me",
      name: id.name,
      kind: id.kind,
      chatOnLogin,
      dashboardHref: id.kind === "agent" ? "/admin/agent" : "/admin/dashboard",
    },
    items,
    thread,
  };
}
