import { redirect } from "next/navigation";
import { isTalisprosAdminAuthenticated } from "@/lib/talispros-admin-auth";
import { MARKETING_HOME_PATH } from "@/lib/mapsite-account-session";
import MarketingLoginForm from "./MarketingLoginForm";

export default async function MarketingLoginPage() {
  if (await isTalisprosAdminAuthenticated()) {
    redirect(MARKETING_HOME_PATH);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <MarketingLoginForm />
    </div>
  );
}
