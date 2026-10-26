import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, AGENT_SESSION_COOKIE } from "@/lib/admin-constants";
import {
  ADMIN_PATHNAME_HEADER,
  resolveAdminRequestGate,
} from "@/lib/admin-request-gate";
import { isAdminAppPath, isPublicAdminPath } from "@/lib/admin-paths";
import {
  ADMIN_ACTIVITY_COOKIE,
  ADMIN_IDLE_LOGIN_PATH,
  adminActivityCookieOptions,
} from "@/lib/admin-idle";
import {
  localeFromRequestUrl,
  persistLocaleCookie,
  withLocaleRequestHeader,
} from "@/lib/i18n/middleware";

const PUBLIC_ROUTES = ["/business-office/apply"];

function isBusinessOfficePath(path: string) {
  return path === "/business-office" || path.startsWith("/business-office/");
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // `?lang=de|en` — crawlable German alternates without a /[locale] segment.
  const locale = localeFromRequestUrl(request.nextUrl);

  if (isAdminAppPath(path)) {
    // Admin idle cap (Global / granted FAST-code admins): no recent activity
    // cookie → end the admin session server-side and show the idle notice.
    const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminActive = Boolean(request.cookies.get(ADMIN_ACTIVITY_COOKIE)?.value);
    if (adminSession && !adminActive && !isPublicAdminPath(path)) {
      const res = NextResponse.redirect(new URL(ADMIN_IDLE_LOGIN_PATH, request.url));
      res.cookies.set(ADMIN_SESSION_COOKIE, "", adminActivityCookieOptions(0));
      return persistLocaleCookie(res, locale);
    }

    const gate = resolveAdminRequestGate({
      pathname: path,
      adminSessionCookie: request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      agentSessionCookie: request.cookies.get(AGENT_SESSION_COOKIE)?.value,
      search: request.nextUrl.search,
    });

    if (gate.action === "redirect") {
      return persistLocaleCookie(
        NextResponse.redirect(new URL(gate.to, request.url)),
        locale,
      );
    }

    const requestHeaders = withLocaleRequestHeader(new Headers(request.headers), locale);
    requestHeaders.set(ADMIN_PATHNAME_HEADER, path);
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // Every /admin request by an active admin slides the idle cap forward.
    if (adminSession && adminActive) {
      res.cookies.set(ADMIN_ACTIVITY_COOKIE, "1", adminActivityCookieOptions());
    }
    return persistLocaleCookie(res, locale);
  }

  if (isBusinessOfficePath(path) && !PUBLIC_ROUTES.includes(path)) {
    const authCookie = request.cookies.get("auth");

    if (!authCookie) {
      return persistLocaleCookie(
        NextResponse.redirect(new URL("/", request.url)),
        locale,
      );
    }
  }

  if (!locale) return NextResponse.next();

  return persistLocaleCookie(
    NextResponse.next({
      request: { headers: withLocaleRequestHeader(new Headers(request.headers), locale) },
    }),
    locale,
  );
}

export const config = {
  matcher: [
    "/business-office/:path*",
    "/admin",
    "/admin/:path*",
    // Any page URL carrying ?lang= (language alternates / shared German links).
    {
      source: "/((?!api|_next/static|_next/image|favicon).*)",
      has: [{ type: "query", key: "lang" }],
    },
  ],
};
