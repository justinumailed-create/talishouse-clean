import { redirect } from "next/navigation";
import { getClientAnalyticsSession } from "@/lib/client-analytics-auth";
import { CLIENT_DASHBOARD_PATH } from "@/lib/mapsite-account-session";
import { safeAishaReturnPath } from "@/lib/talispros/aisha-call-path";
import ClientLoginForm from "./ClientLoginForm";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/client/login");
}

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const next = safeAishaReturnPath((await searchParams)?.next);
  const session = await getClientAnalyticsSession();
  if (session) {
    redirect(next || CLIENT_DASHBOARD_PATH);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <ClientLoginForm nextPath={next} />
    </div>
  );
}
