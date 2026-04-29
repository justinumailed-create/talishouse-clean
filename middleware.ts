import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/business-office/apply"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
  matcher: ["/business-office/:path*"],
};
