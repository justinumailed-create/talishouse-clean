import { redirect } from "next/navigation";
import { accountHasAdminScope } from "./admin-constants";
import { getAdminSessionAccount } from "./admin-auth";

/**
 * Marketing Manager portal (`/talispros/marketing/*`).
 *
 * Access is the Global Admin FAST-code session only (scope `platform-content`).
 * The former Supabase email/password login (and `MARKETING_MANAGER_EMAILS`
 * allowlist) was removed: an `auth.users` row never grants admin access.
 */
export interface MarketingManagerSession {
  userId: string;
  email: string | null;
}

async function getFastCodePlatformContentSession(): Promise<MarketingManagerSession | null> {
  const account = await getAdminSessionAccount();
  if (!account || !accountHasAdminScope(account, "platform-content")) {
    return null;
  }

  return {
    userId: `admin:${account.fastCode}`,
    email: account.email,
  };
}

export async function requireMarketingManagerSession(): Promise<MarketingManagerSession> {
  const session = await getFastCodePlatformContentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function isMarketingManagerAuthenticated(): Promise<boolean> {
  return (await getFastCodePlatformContentSession()) !== null;
}

export async function requireMarketingManagerPage(): Promise<MarketingManagerSession> {
  const session = await getFastCodePlatformContentSession();
  if (session) {
    return session;
  }

  const account = await getAdminSessionAccount();
  redirect(account ? "/admin/dashboard" : "/admin/login");
}
