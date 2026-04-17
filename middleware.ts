import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/utils/constants";
import { PROTECTED_ROUTE_PREFIXES, ROLE_TO_DASHBOARD } from "@/utils/constants";

function getRequiredRoleForPath(pathname: string) {
  const entry = Object.entries(PROTECTED_ROUTE_PREFIXES).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return entry?.[1] ?? null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRoleForPath(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  if (payload.role !== requiredRole) {
    const redirectUrl = ROLE_TO_DASHBOARD[payload.role] ?? "/unauthorized";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/reception/:path*"],
};
