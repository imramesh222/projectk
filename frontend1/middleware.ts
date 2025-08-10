import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated, getCurrentUserWithFallback } from '@/lib/auth';

// Check if the code is running on the server
const isServer = typeof window === 'undefined';

// List of public paths that don't require authentication
const publicPaths = ['/login', '/register', '/_next', '/favicon.ico'];

// Global roles that exist outside organizations
const GLOBAL_ROLES = ['superadmin', 'user'];

// Organization-specific roles
const ORG_ROLES = [
  'admin',
  'salesperson',
  'verifier',
  'project_manager',
  'support',
  'developer'
];

// List of protected paths and their allowed roles
const protectedPaths: Record<string, string[]> = {
  // Superadmin dashboard - only for global superadmins
  '/superadmin': ['superadmin'],
  
  // Organization dashboard - for org admins and superadmins
  '/organization/dashboard': ['admin', 'superadmin'],
  
  // User dashboard - for regular users and organization members
  '/dashboard': ['user', ...ORG_ROLES],
  
  // Organization-specific routes - only accessible within organization context
  '/organization': ORG_ROLES,
  '/projects': ['project_manager', 'developer', 'admin'],
  '/sales': ['salesperson', 'admin'],
  '/support': ['support', 'admin'],
  '/verification': ['verifier', 'admin']
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
  console.log('[MIDDLEWARE] Current user:', JSON.stringify(user, null, 2));
  
  if (!user) {
    console.log('[MIDDLEWARE] No user found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Debug: Log all protected paths and their allowed roles
  console.log('[MIDDLEWARE] All protected paths and roles:', JSON.stringify(protectedPaths, null, 2));
  
  // Check if user has access to the requested path
  const allowedRoles = protectedPaths[basePath];
  console.log(`[MIDDLEWARE] Checking access for path: ${basePath}`);
  console.log(`[MIDDLEWARE] User role: ${user.role}, Allowed roles:`, allowedRoles);
  
  if (allowedRoles) {
    const normalizedUserRole = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    
    console.log(`[MIDDLEWARE] Normalized - User role: ${normalizedUserRole}, Allowed roles:`, normalizedAllowedRoles);
    
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.log(`[MIDDLEWARE] Access denied for role ${normalizedUserRole} at path ${basePath}`);
      const dashboardPath = getDashboardPath(normalizedUserRole);
      console.log(`[MIDDLEWARE] Redirecting to dashboard path: ${dashboardPath}`);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    console.log(`[MIDDLEWARE] Access granted: User ${normalizedUserRole} has access to ${basePath}`);
  } else {
    console.log(`[MIDDLEWARE] No role restrictions for path: ${basePath}`);
  }

  return NextResponse.next();
}

function getDashboardPath(role: string): string {
  console.log('[MIDDLEWARE] Getting dashboard path for role:', role);
  
  const normalizedRole = role.toLowerCase();
  let path = '/';
  
  // Handle global roles
  if (normalizedRole === 'superadmin') {
    path = '/superadmin';
  } 
  // Handle organization admin role
  else if (normalizedRole === 'admin' || normalizedRole === 'organization_admin') {
    path = '/organization/dashboard';
  }
  // Handle all other organization roles
  else if (ORG_ROLES.includes(normalizedRole)) {
    path = '/dashboard';
  }
  // Default for regular users
  else if (normalizedRole === 'user') {
    path = '/dashboard';
  }
  
  console.log('[MIDDLEWARE] Resolved dashboard path:', path);
  return path;
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
