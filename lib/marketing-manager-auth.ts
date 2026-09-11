import { redirect } from "next/navigation";
import {
  MARKETING_LOGIN_PATH,
  MARKETING_UNAUTHORIZED_PATH,
} from "./mapsite-account-session";
import { BUILTIN_ADMIN_EMAILS } from "./admin-constants";
import {
  getTalisprosAdminSession,
} from "./talispros-admin-auth";

export interface MarketingManagerSession {
  userId: string;
  email: string | null;
}

function getAllowedMarketingManagerEmails(): string[] {
  const raw = process.env.MARKETING_MANAGER_EMAILS ?? "";
  const fromEnv = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // When an allowlist is configured, always include Ralph + Arun.
  // Do not create an allowlist from builtins alone — an empty env still
  // means “any authenticated marketing session” (existing behavior).
  if (fromEnv.length === 0) {
    return [];
  }

  return [...new Set([...fromEnv, ...BUILTIN_ADMIN_EMAILS.map((email) => email.toLowerCase())])];
}

export async function requireMarketingManagerSession(): Promise<MarketingManagerSession> {
  const session = await getTalisprosAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const allowed = getAllowedMarketingManagerEmails();
  const email = session.email?.toLowerCase() ?? "";

  if (allowed.length > 0 && !allowed.includes(email)) {
    throw new Error("Forbidden");
  }

  return session;
}

export async function isMarketingManagerAuthenticated(): Promise<boolean> {
  try {
    await requireMarketingManagerSession();
    return true;
  } catch {
    return false;
  }
}

export async function requireMarketingManagerPage(): Promise<MarketingManagerSession> {
  const session = await getTalisprosAdminSession();
  if (!session) {
    redirect(MARKETING_LOGIN_PATH);
  }

  const allowed = getAllowedMarketingManagerEmails();
  const email = session.email?.toLowerCase() ?? "";

  if (allowed.length > 0 && !allowed.includes(email)) {
    redirect(MARKETING_UNAUTHORIZED_PATH);
  }

  return session;
}
