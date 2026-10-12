import RegisterAgentsClient from "@/components/talispros/RegisterAgentsClient";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/register-agents");
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterAgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fastCode = firstParam(params.fastCode)?.trim() || null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const audience = firstParam(params.audience)?.trim() || null;

  return (
    <RegisterAgentsClient
      fastCode={fastCode}
      mapsiteId={mapsiteId}
      audience={audience}
    />
  );
}
