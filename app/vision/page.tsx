import { pageMetadata } from "@/lib/seo/page-metadata";
import { ownershipTopicFromId } from "@/lib/talispros/ownership-contact";
import DiscussProjectClient from "@/components/talisu/DiscussProjectClient";

export async function generateMetadata() {
  return pageMetadata("/vision");
}

/** TalisU home page: the same project form, for people Webster sends here. */
export default async function TalisUHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string | string[]; code?: string | string[] }>;
}) {
  const query = (await searchParams) ?? {};
  const raw = query.topic;
  const rawCode = query.code;
  const topic = ownershipTopicFromId(Array.isArray(raw) ? raw[0] : raw);
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode)?.trim() || null;
  return <DiscussProjectClient topic={topic} code={code} />;
}
