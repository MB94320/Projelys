import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySignedSession } from "@/app/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/auth/reset-password",
  "/auth/forgot-password",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isIgnoredPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isIgnoredPath(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName)?.value;
  const user = verifySignedSession(token);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!isPublicPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};