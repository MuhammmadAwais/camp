import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Ultra-lightweight middleware for static asset pass-through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
