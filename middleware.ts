import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAccessCookieName, verifyAccessSession } from "@/lib/access";

function isProtectedPath(pathname: string) {
  if (pathname === "/login") {
    return false;
  }

  if (pathname.startsWith("/api/auth/")) {
    return false;
  }

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return false;
  }

  return pathname === "/" || pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    const token = request.cookies.get(getAccessCookieName())?.value;
    const isAuthenticated = await verifyAccessSession(token);

    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAccessCookieName())?.value;
  const isAuthenticated = await verifyAccessSession(token);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);

  if (pathname !== "/") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
