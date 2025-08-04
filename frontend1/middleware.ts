import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated, getCurrentUserWithFallback } from '@/lib/auth';

// Check if the code is running on the server
const isServer = typeof window === 'undefined';

// List of public paths that don't require authentication
const publicPaths = ['/login', '/register', '/_next', '/favicon.ico'];

// List of protected paths and their allowed roles
const protectedPaths: Record<string, string[]> = {
  '/superadmin': ['superadmin'],
  '/admin': ['admin', 'superadmin'],
  '/manager': ['manager', 'admin', 'superadmin'],
  '/developer': ['developer', 'manager', 'admin', 'superadmin'],
  '/sales': ['sales', 'admin', 'superadmin'],
  '/support': ['support', 'admin', 'superadmin'],
  '/verifier': ['verifier', 'admin', 'superadmin'],
};

// Get the base path from a URL path
function getBasePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? `/${parts[0]}` : '/';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = getBasePath(pathname);
  
  console.log(`[MIDDLEWARE] Path: ${pathname}, Base Path: ${basePath}`);
  
  // Skip middleware for API routes, static files, and public paths
  if (
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    publicPaths.some(publicPath => pathname.startsWith(publicPath))
  ) {
    console.log(`[MIDDLEWARE] Skipping middleware for path: ${pathname}`);
    return NextResponse.next();
  }

  // Skip authentication check for protected paths during SSR
  // Let the client-side handle the redirection if needed
  if (isServer) {
    console.log('[MIDDLEWARE] Server-side rendering, skipping auth check');
    return NextResponse.next();
  }

  // Client-side authentication check
  console.log('[MIDDLEWARE] Client-side, checking authentication...');
  const isLoggedIn = isAuthenticated();
  console.log(`[MIDDLEWARE] Is authenticated: ${isLoggedIn}`);
  
  // Handle unauthenticated users
  if (!isLoggedIn) {
    console.log('[MIDDLEWARE] User not authenticated, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get current user
  const user = getCurrentUserWithFallback();
  console.log('[MIDDLEWARE] Current user:', user);
  
  if (!user) {
    console.log('[MIDDLEWARE] No user found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has access to the requested path
  const allowedRoles = protectedPaths[basePath];
  console.log(`[MIDDLEWARE] Allowed roles for ${basePath}:`, allowedRoles);
  
  if (allowedRoles) {
    if (!allowedRoles.includes(user.role)) {
      console.log(`[MIDDLEWARE] User role ${user.role} not in allowed roles, redirecting to dashboard`);
      const dashboardPath = getDashboardPath(user.role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    console.log(`[MIDDLEWARE] User ${user.role} has access to ${basePath}`);
  } else {
    console.log(`[MIDDLEWARE] No role restrictions for path: ${basePath}`);
  }

  return NextResponse.next();
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'superadmin':
      return '/superadmin';
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    case 'developer':
      return '/developer';
    case 'sales':
      return '/sales';
    case 'support':
      return '/support';
    case 'verifier':
      return '/verifier';
    default:
      return '/';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
