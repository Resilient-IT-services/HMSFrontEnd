import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/utils/constants";
import { getRequiredRoleForPath } from "@/utils/helpers";

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
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/reception/:path*"],
};
