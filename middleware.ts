import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-constants";
import {
  ADMIN_PATHNAME_HEADER,
  TALISPROS_ADMIN_MARKER_COOKIE,
  resolveAdminRequestGate,
} from "@/lib/admin-request-gate";
import { isAdminAppPath } from "@/lib/admin-paths";

const PUBLIC_ROUTES = ["/business-office/apply"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isAdminAppPath(path)) {
    const gate = resolveAdminRequestGate({
      pathname: path,
      adminSessionCookie: request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      talisprosAdminMarker: request.cookies.get(TALISPROS_ADMIN_MARKER_COOKIE)?.value,
    });

    if (gate.action === "redirect") {
      return NextResponse.redirect(new URL(gate.to, request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(ADMIN_PATHNAME_HEADER, path);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
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
