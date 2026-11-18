import { CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";

/** Where a registered owner talks to Aisha after signing in. */
export const AISHA_CALL_PATH = "/aisha?call=1";

/** Sign-in, then Aisha. Only this return path is accepted. */
export function aishaSignInPath(): string {
  return `${CLIENT_LOGIN_PATH}?next=${encodeURIComponent(AISHA_CALL_PATH)}`;
}

export function safeAishaReturnPath(next: string | undefined | null): string | null {
  const raw = next?.trim() || "";
  if (!raw || raw.includes("\\") || raw.includes("//")) return null;
  let url: URL;
  try {
    url = new URL(raw, "http://local.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "http://local.invalid") return null;
  if (url.pathname !== "/aisha") return null;
  if (url.search !== "" && url.search !== "?call=1") return null;
  if (url.hash) return null;
  return `${url.pathname}${url.search}`;
}
