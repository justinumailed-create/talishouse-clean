import { redirect } from "next/navigation";
import { isTalisprosAdminAuthenticated } from "@/lib/talispros-admin-auth";
import TalisprosAdminLoginForm from "./TalisprosAdminLoginForm";

export default async function TalisprosAdminLoginPage() {
  if (await isTalisprosAdminAuthenticated()) {
    redirect("/talispros/admin");
  }

  return <TalisprosAdminLoginForm />;
}
