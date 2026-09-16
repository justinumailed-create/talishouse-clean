import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  accountHasAdminScope,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
  type AdminAccount,
  type AdminScope,
} from "./admin-constants";
import { accountCanAccessAdminPath } from "./admin-route-access";

/** FAST-code Global Admin session — 24 hours after a successful login. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

function adminSessionCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function getAdminSessionValue(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  return isAuthorizedAdminFastCode(value) ? value : null;
}

export async function writeAdminSessionCookie(fastCode: string): Promise<AdminAccount | null> {
  const account = getAdminAccountByFastCode(fastCode);
  if (!account) return null;

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    account.fastCode,
    adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE),
  );
  return account;
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", adminSessionCookieOptions(0));
  cookieStore.delete(ADMIN_SESSION_COOKIE);
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

export async function requireAdminScope(scope: AdminScope): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account || !accountHasAdminScope(account, scope)) {
    throw new Error("Unauthorized");
  }
  return account;
}

export async function requireAdminScopePage(scope: AdminScope): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }
  if (!accountHasAdminScope(account, scope)) {
    redirect("/admin/dashboard");
  }
  return account;
}

export async function requireAdminPathAccess(pathname: string): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }
  if (!accountCanAccessAdminPath(account, pathname)) {
    redirect("/admin/dashboard");
  }
  return account;
}
