import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
  type AdminAccount,
} from "./admin-constants";

export async function getAdminSessionValue(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSessionValue();
  return isAuthorizedAdminFastCode(session);
}

export async function getAdminSessionAccount(): Promise<AdminAccount | null> {
  return getAdminAccountByFastCode(await getAdminSessionValue());
}

export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
