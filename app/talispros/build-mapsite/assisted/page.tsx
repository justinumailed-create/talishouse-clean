import RahulBuildAssistClient from "@/components/talispros/RahulBuildAssistClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssistedBuildMapSitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audience = firstParam(params.audience)?.trim().toLowerCase() || "listings";

  return <RahulBuildAssistClient initialAudienceType={audience} />;
}
