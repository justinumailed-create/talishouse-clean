import { redirect } from "next/navigation";

/** Chat moved to the standalone /chat app. */
export default function LegacyAgentChatPage() {
  redirect("/chat");
}
