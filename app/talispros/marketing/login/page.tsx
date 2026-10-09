import { redirect } from "next/navigation";

/** Email/password Marketing Manager login was removed — use the FAST-code admin login. */
export default function MarketingLoginPage() {
  redirect("/admin/login");
}
