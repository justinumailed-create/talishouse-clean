import { redirect } from "next/navigation";
import { getClientAnalyticsSession } from "@/lib/client-analytics-auth";
import { CLIENT_DASHBOARD_PATH } from "@/lib/mapsite-account-session";
import ClientLoginForm from "./ClientLoginForm";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/client/login");
}

export default async function ClientLoginPage() {
  const session = await getClientAnalyticsSession();
  if (session) {
    redirect(CLIENT_DASHBOARD_PATH);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <ClientLoginForm />
    </div>
  );
}
