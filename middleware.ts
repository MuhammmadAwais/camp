import { NextRequest, NextResponse } from 'next/server';
import { decryptSession, SESSION_COOKIE_NAME } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip Next.js internal files, static assets, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/illustrations') ||
    pathname.startsWith('/textures') ||
    pathname.startsWith('/brands-logo') ||
    pathname.startsWith('/car-company-logos') ||
    pathname.startsWith('/showcase-cars-with-bg') ||
    pathname.startsWith('/plain-cars-images') ||
    pathname.includes('.') // Static files like favicon.ico, logo.png, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Read and decrypt session from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(sessionCookie);
  const isAuthenticated = !!session?.user;
  const role = session?.user.role;

  // 3. Define route segments
  const isSellerRoute = pathname.startsWith('/seller');
  const isDealerRoute = pathname.startsWith('/dealer');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // 4. Protect Seller Routes
  if (isSellerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'SELLER') {
      // If a dealer tries to access seller portal, redirect to dealer inventory
      return NextResponse.redirect(new URL(role === 'ADMIN' ? '/admin/moderation' : '/dealer/inventory', request.url));
    }
  }

  // 5. Protect Dealer Routes
  if (isDealerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'DEALER_ADMIN' && role !== 'DEALER_AGENT') {
      return NextResponse.redirect(new URL(role === 'ADMIN' ? '/admin/moderation' : '/seller/dashboard', request.url));
    }
  }

  // 6. Protect Admin Routes
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL(role === 'SELLER' ? '/seller/dashboard' : '/dealer/inventory', request.url));
    }
  }

  // 7. Redirect logged-in users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    if (role === 'SELLER') {
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    } else if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/moderation', request.url));
    } else {
      return NextResponse.redirect(new URL('/dealer/inventory', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
