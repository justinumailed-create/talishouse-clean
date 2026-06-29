import { redirect } from "next/navigation";

export default async function LegacyAdminMapSiteRedirect({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;
  redirect(`/talispros/admin/mapsites/${fastCode}`);
}
