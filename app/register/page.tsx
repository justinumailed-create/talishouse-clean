import RegisterPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { enforcePmcRegistrationGate, firstParam } from "@/lib/talisu/pmc-gate";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/register");
}

/** PMC gate: claimed Mapsite + signed Service Agreement before any registration payment. */
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ fastCode?: string | string[] }>;
}) {
  await enforcePmcRegistrationGate(firstParam((await searchParams)?.fastCode));
  return <RegisterPage />;
}
