import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isLoggedIn = !!accessToken || !!refreshToken;

  console.log(`[middleware] ──────────────────────────────`);
  console.log(`[middleware] path         : ${pathname}`);
  console.log(`[middleware] access_token : ${accessToken ? accessToken.slice(0, 40) + "…" : "MISSING"}`);
  console.log(`[middleware] refresh_token: ${refreshToken ? refreshToken.slice(0, 40) + "…" : "MISSING"}`);
  console.log(`[middleware] isLoggedIn   : ${isLoggedIn} | isPublic: ${isPublicRoute(pathname)}`);
  console.log(`[middleware] all cookies  : ${request.cookies.getAll().map((c) => c.name).join(", ") || "(none)"}`);

  // Logged-in users are redirected away from login/signup
  if (isLoggedIn) {
    if (pathname === "/login" || pathname === "/signup" || pathname === "/auth/login" || pathname === "/auth/signup") {
      console.log(`[middleware] → redirect to /home (already authenticated)`);
      return NextResponse.redirect(new URL("/home", request.url));
    }
    console.log(`[middleware] → next() (authenticated)`);
    return NextResponse.next();
  }

  // Unauthenticated users can only access public routes
  if (!isPublicRoute(pathname)) {
    console.log(`[middleware] → redirect to /login`);
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  console.log(`[middleware] → next() (public route)`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|\\.well-known|icons|images|fonts|.*\\.webp|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.gif|.*\\.webm|.*\\.mp4|.*\\.woff2?|.*\\.ttf).*)",
  ],
};
