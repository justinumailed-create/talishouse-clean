import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminAccountByFastCode } from "@/lib/admin-constants";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";

const PUBLIC_ROUTES = ["/business-office/apply"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (path === "/admin/login" || path.startsWith("/admin/login/")) {
      return NextResponse.next();
    }

    if (path.startsWith("/admin/talismaps")) {
      return NextResponse.next();
    }

    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const account = getAdminAccountByFastCode(session);
    if (!account) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!accountCanAccessAdminPath(account, path)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // Bypass auth completely for public routes
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("auth");

  if (!authCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/business-office/:path*", "/admin", "/admin/:path*"],
};
