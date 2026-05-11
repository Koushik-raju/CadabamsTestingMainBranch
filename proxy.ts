import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sanitizeReturnTo } from "./lib/return-to";

// Routes accessible without a session. Everything else requires auth.
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/auth/login",
  "/auth/signup",
  "/privacy-policy",
  "/term-and-condition",
  "/worksheet",
  "/assessment",
  "/onboarding",
];

function isPublicConsultPath(pathname: string): boolean {
  if (pathname === "/consult/find-therapist" || pathname.startsWith("/consult/find-therapist/")) {
    return true;
  }
  if (pathname.startsWith("/consult/booking/")) {
    return true;
  }
  return false;
}

function isPublicRoute(pathname: string): boolean {
  if (isPublicConsultPath(pathname)) return true;
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isLoggedIn = !!accessToken || !!refreshToken;

  devLog(`[middleware] path         : ${pathname}`);
  devLog(`[middleware] isLoggedIn   : ${isLoggedIn} | isPublic: ${isPublicRoute(pathname)}`);

  if (isLoggedIn) {
    if (
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/auth/login" ||
      pathname === "/auth/signup"
    ) {
      const returnTo =
        sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo")) ??
        sanitizeReturnTo(request.nextUrl.searchParams.get("from"));
      const dest = returnTo ?? "/home";
      devLog(`[middleware] → redirect (authed) to ${dest}`);
      return NextResponse.redirect(new URL(dest, request.url));
    }
    devLog(`[middleware] → next() (authenticated)`);
    return NextResponse.next();
  }

  if (!isPublicRoute(pathname)) {
    devLog(`[middleware] → redirect to /auth/login`);
    const url = new URL("/auth/login", request.url);
    const pathWithQuery = pathname + (request.nextUrl.search || "");
    url.searchParams.set("returnTo", pathWithQuery);
    return NextResponse.redirect(url);
  }

  devLog(`[middleware] → next() (public route)`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|\\.well-known|icons|images|fonts|.*\\.webp|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.gif|.*\\.webm|.*\\.mp4|.*\\.woff2?|.*\\.ttf).*)",
  ],
};
