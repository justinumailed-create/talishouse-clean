import { pageMetadata } from "@/lib/seo/page-metadata";
import { ownershipTopicFromId } from "@/lib/talispros/ownership-contact";
import DiscussProjectClient from "@/components/talisu/DiscussProjectClient";

export async function generateMetadata() {
  return pageMetadata("/talisu/discuss");
}

/**
 * "Share a Project Vision" (Ralf, Oct 17 + Oct 18 2026): steers toward the
 * transaction structures (CSFT buttons, explanations below) with the contact
 * form beside them. Every Learn More link opens it (?topic=…), and TalisBOT's
 * "Share a Project Vision" button links straight here.
 */
export default async function TalisUDiscussPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string | string[] }>;
}) {
  const raw = (await searchParams)?.topic;
  const topic = ownershipTopicFromId(Array.isArray(raw) ? raw[0] : raw);
  return <DiscussProjectClient topic={topic} />;
}
