import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-constants";
import {
  ADMIN_PATHNAME_HEADER,
  TALISPROS_ADMIN_MARKER_COOKIE,
  resolveAdminRequestGate,
} from "@/lib/admin-request-gate";
import { isAdminAppPath } from "@/lib/admin-paths";
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
    const gate = resolveAdminRequestGate({
      pathname: path,
      adminSessionCookie: request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      talisprosAdminMarker: request.cookies.get(TALISPROS_ADMIN_MARKER_COOKIE)?.value,
    });

    if (gate.action === "redirect") {
      return persistLocaleCookie(
        NextResponse.redirect(new URL(gate.to, request.url)),
        locale,
      );
    }

    const requestHeaders = withLocaleRequestHeader(new Headers(request.headers), locale);
    requestHeaders.set(ADMIN_PATHNAME_HEADER, path);
    return persistLocaleCookie(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
      locale,
    );
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
