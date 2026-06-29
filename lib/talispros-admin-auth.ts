import { redirect } from "next/navigation";
import {
  getAdminSessionValue,
  isAdminAuthenticated,
  requireAdminSession,
} from "./admin-auth";
import { ADMIN_FAST_CODE } from "./admin-constants";

export {
  isAdminAuthenticated as isTalisprosAdminAuthenticated,
  requireAdminSession as requireTalisprosAdminSession,
};

export async function requireTalisprosAdminPage(): Promise<void> {
  const session = await getAdminSessionValue();
  if (session !== ADMIN_FAST_CODE) {
    redirect("/talispros/admin/login");
  }
}
