import ChatApp from "@/components/chat/ChatApp";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { isUuid } from "@/lib/chat/model";
import { notFound } from "next/navigation";
import { loadChat } from "../load";

export async function generateMetadata() {
  return pageMetadata("/chat/[conversationId]");
}

export const dynamic = "force-dynamic";

export default async function ChatConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!isUuid(conversationId)) notFound();
  const data = await loadChat(conversationId);
  return <ChatApp viewer={data.viewer} conversationId={conversationId} initialItems={data.items} initialThread={data.thread} />;
}
