import { NextRequest, NextResponse } from 'next/server';

const LEGACY_PREFIXES = ['/lenders', '/crm', '/drafting'] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('roscap_session');

  for (const prefix of LEGACY_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return NextResponse.redirect(new URL(`/dashboard${pathname}`, request.url));
    }
  }

  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard/lenders', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/lenders/:path*', '/crm/:path*', '/drafting/:path*', '/lenders', '/crm', '/drafting'],
};
