import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/session")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("projelys_session");
  const sessionToken = sessionCookie?.value || "";

  const hasSession = sessionToken.trim().length > 0;

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};