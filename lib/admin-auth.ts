import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_FAST_CODE, ADMIN_SESSION_COOKIE } from "./admin-constants";

export async function getAdminSessionValue(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSessionValue();
  return session === ADMIN_FAST_CODE;
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
