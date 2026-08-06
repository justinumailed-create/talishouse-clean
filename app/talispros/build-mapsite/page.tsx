import { redirect } from "next/navigation";
import BuildMapSiteClient from "./BuildMapSiteClient";

export default async function BuildMapSitePage({
  searchParams,
}: {
  searchParams: Promise<{
    fastCode?: string;
    audience?: string;
    setup?: string;
  }>;
}) {
  const params = await searchParams;
  const fastCode = params.fastCode?.trim();
  const audience = params.audience?.trim().toLowerCase() || "";
  const onboardingMode = params.setup?.trim().toLowerCase() === "self";

  if (fastCode) {
    redirect(
      `/talispros/mapsites/${encodeURIComponent(fastCode.toLowerCase())}`
    );
  }

  return (
    <BuildMapSiteClient
      initialAudienceType={audience}
      onboardingMode={onboardingMode ? "self" : "standard"}
    />
  );
}
