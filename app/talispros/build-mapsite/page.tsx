import { redirect } from "next/navigation";
import BuildMapsiteClient from "./BuildMapsiteClient";

export default async function BuildMapsitePage({
  searchParams,
}: {
  searchParams: Promise<{ fastCode?: string }>;
}) {
  const params = await searchParams;
  const fastCode = params.fastCode?.trim();

  if (fastCode) {
    redirect(
      `/talispros/mapsites/${encodeURIComponent(fastCode.toLowerCase())}`
    );
  }

  return <BuildMapsiteClient />;
}
