import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/signup', '/new-chat', '/find-therapist', '/assessment',
  '/privacy-policy', '/term-and-condition', '/doctors-list', '/booking', '/checkout',
  '/chat-history', '/worksheet', '/journey'];

const authOnlyRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const isAuthOnly = authOnlyRoutes.includes(pathname);

  if (!token && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthOnly) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
