import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/', '/login', '/signup', '/new-chat', '/find-therapist', '/assessment',
  '/privacy-policy', '/term-and-condition', '/doctors-list', '/booking', '/checkout',
  '/chat-history', '/worksheet', '/journey',
];

const authOnlyRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use access_token (set by /api/auth/* route handlers)
  // Fall back to refresh_token so a user with an expired access token
  // but a valid refresh token isn't kicked to login immediately.
  const hasSession =
    !!request.cookies.get('access_token')?.value ||
    !!request.cookies.get('refresh_token')?.value;

  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const isAuthOnly = authOnlyRoutes.includes(pathname);

  if (!hasSession && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthOnly) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
