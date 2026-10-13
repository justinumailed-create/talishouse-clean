import ChatApp from "@/components/chat/ChatApp";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { loadChat } from "./load";

export async function generateMetadata() {
  return pageMetadata("/chat");
}

export const dynamic = "force-dynamic";

export default async function ChatInboxPage() {
  const data = await loadChat(null);
  return <ChatApp viewer={data.viewer} conversationId={null} initialItems={data.items} initialThread={null} />;
}
