import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const ADMIN_PATHS = ["/admin"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith("/u/"));
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json") ||
    pathname === "/sw.js" ||
    pathname === "/sw.js.map"
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect non-public routes
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
