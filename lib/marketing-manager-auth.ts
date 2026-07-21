import { redirect } from "next/navigation";
import {
  MARKETING_LOGIN_PATH,
  MARKETING_UNAUTHORIZED_PATH,
} from "./mapsite-account-session";
import {
  getTalisprosAdminSession,
} from "./talispros-admin-auth";

export interface MarketingManagerSession {
  userId: string;
  email: string | null;
}

function getAllowedMarketingManagerEmails(): string[] {
  const raw = process.env.MARKETING_MANAGER_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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
