import ChatApp from "@/components/chat/ChatApp";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { loadViewer } from "./load";

export async function generateMetadata() {
  return pageMetadata("/chat");
}

export const dynamic = "force-dynamic";

export default async function ChatInboxPage() {
  return <ChatApp viewer={await loadViewer()} conversationId={null} />;
}
