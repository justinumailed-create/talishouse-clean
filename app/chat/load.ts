import { redirect } from "next/navigation";
import { getChatMe, getChatOnLogin } from "@/lib/chat/server";
import type { ChatViewer } from "@/components/chat/ChatApp";

export async function loadViewer(): Promise<ChatViewer> {
  const me = await getChatMe();
  if (!me) redirect("/agent/login");
  return {
    memberId: me.memberId,
    name: me.name,
    kind: me.kind,
    chatOnLogin: me.agentId ? await getChatOnLogin(me.agentId) : null,
    dashboardHref: me.kind === "agent" ? "/admin/agent" : "/admin/dashboard",
  };
}
